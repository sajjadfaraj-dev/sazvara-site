<?php
declare(strict_types=1);

/*
 * Sazvara diagnostic intake v2.
 * - No database dependency.
 * - No third-party form service.
 * - Private queue lives outside DOCUMENT_ROOT.
 * - Mail notification goes to the existing Sazvara operator mailbox.
 * - No automatic email is sent to the visitor.
 */

const SAZVARA_RECIPIENT = 'sajjad@sazvara.ir';
const RETENTION_SECONDS = 2592000; // 30 days
const RATE_WINDOW_SECONDS = 3600;
const RATE_LIMIT = 5;

function finish_redirect(string $lang, string $query, int $status = 303): never {
    $base = $lang === 'fa' ? '/fa/contact/' : '/contact/';
    header('Cache-Control: no-store');
    header('Location: ' . $base . '?' . $query . '#intake-form', true, $status);
    exit;
}

function clean_text(string $value, int $max): string {
    $value = trim(str_replace(["\r\n", "\r"], "\n", $value));
    $value = preg_replace('/[^\P{C}\n\t]/u', '', $value) ?? '';
    if (function_exists('mb_substr')) return mb_substr($value, 0, $max, 'UTF-8');
    return substr($value, 0, $max);
}

function text_len(string $value): int {
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function same_site_request(): bool {
    foreach (['HTTP_ORIGIN', 'HTTP_REFERER'] as $key) {
        if (empty($_SERVER[$key])) continue;
        $host = strtolower((string) parse_url((string) $_SERVER[$key], PHP_URL_HOST));
        if (!in_array($host, ['sazvara.ir', 'www.sazvara.ir', 'localhost', '127.0.0.1'], true)) return false;
    }
    return true;
}

function private_dir(): string {
    $docroot = rtrim((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''), DIRECTORY_SEPARATOR);
    if ($docroot === '') throw new RuntimeException('document_root_missing');
    $dir = dirname($docroot) . DIRECTORY_SEPARATOR . '.sazvara-intake';
    if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) {
        throw new RuntimeException('private_queue_create_failed');
    }
    @chmod($dir, 0700);
    return $dir;
}

function cleanup_old(string $dir): void {
    $cut = time() - RETENTION_SECONDS;
    foreach (glob($dir . DIRECTORY_SEPARATOR . 'lead-*.json') ?: [] as $file) {
        if (is_file($file) && (int) @filemtime($file) < $cut) @unlink($file);
    }
    foreach (glob($dir . DIRECTORY_SEPARATOR . 'rate-*.json') ?: [] as $file) {
        if (is_file($file) && (int) @filemtime($file) < time() - RATE_WINDOW_SECONDS * 2) @unlink($file);
    }
}

function rate_ok(string $dir): bool {
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $key = hash('sha256', $ip);
    $path = $dir . DIRECTORY_SEPARATOR . 'rate-' . $key . '.json';
    $now = time();
    $data = ['start' => $now, 'count' => 0];

    if (is_file($path)) {
        $decoded = json_decode((string) @file_get_contents($path), true);
        if (is_array($decoded) && isset($decoded['start'], $decoded['count'])) $data = $decoded;
    }
    if (($now - (int) $data['start']) >= RATE_WINDOW_SECONDS) $data = ['start' => $now, 'count' => 0];
    if ((int) $data['count'] >= RATE_LIMIT) return false;
    $data['count'] = (int) $data['count'] + 1;
    @file_put_contents($path, json_encode($data, JSON_UNESCAPED_SLASHES), LOCK_EX);
    @chmod($path, 0600);
    return true;
}

$lang = ($_POST['language'] ?? '') === 'fa' ? 'fa' : 'en';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Method Not Allowed\n";
    exit;
}

if (!same_site_request()) {
    http_response_code(403);
    echo "Forbidden\n";
    exit;
}

$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > 20000) {
    http_response_code(413);
    echo "Payload Too Large\n";
    exit;
}

# Honeypot: silently accept bot submissions without doing anything.
if (trim((string) ($_POST['website'] ?? '')) !== '') {
    finish_redirect($lang, 'sent=1');
}

$started = (int) ($_POST['started_at'] ?? 0);
$elapsed = time() - $started;
if ($started <= 0 || $elapsed < 3 || $elapsed > 7200) {
    finish_redirect($lang, 'error=validation');
}

$name = clean_text((string) ($_POST['name'] ?? ''), 100);
$email = trim((string) ($_POST['email'] ?? ''));
$current = clean_text((string) ($_POST['current'] ?? ''), 2000);
$problem = clean_text((string) ($_POST['problem'] ?? ''), 3000);
$outcome = clean_text((string) ($_POST['outcome'] ?? ''), 2000);
$constraints = clean_text((string) ($_POST['constraints'] ?? ''), 2000);
$consent = (string) ($_POST['consent'] ?? '');

if (
    text_len($name) < 2 ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    text_len($current) < 20 ||
    text_len($problem) < 20 ||
    text_len($outcome) < 10 ||
    $consent !== 'yes'
) {
    finish_redirect($lang, 'error=validation');
}

try {
    $queue = private_dir();
    cleanup_old($queue);
    if (!rate_ok($queue)) finish_redirect($lang, 'error=rate');

    $id = 'SZV-' . gmdate('Ymd-His') . '-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
    $record = [
        'id' => $id,
        'received_at_utc' => gmdate('c'),
        'language' => $lang,
        'name' => $name,
        'email' => $email,
        'current' => $current,
        'problem' => $problem,
        'outcome' => $outcome,
        'constraints' => $constraints,
        'consent' => true,
        'notification_attempted' => false,
        'notification_sent' => false,
    ];

    $path = $queue . DIRECTORY_SEPARATOR . 'lead-' . $id . '.json';
    if (file_put_contents($path, json_encode($record, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX) === false) {
        throw new RuntimeException('queue_write_failed');
    }
    @chmod($path, 0600);

    $subject = '[Sazvara Intake] ' . $id;
    $body =
        "Sazvara diagnostic request\n" .
        "ID: {$id}\n" .
        "Received UTC: {$record['received_at_utc']}\n" .
        "Language: {$lang}\n\n" .
        "Name:\n{$name}\n\n" .
        "Email:\n{$email}\n\n" .
        "What exists now:\n{$current}\n\n" .
        "What is going wrong:\n{$problem}\n\n" .
        "Desired outcome:\n{$outcome}\n\n" .
        "Constraints:\n{$constraints}\n";

    $safeReply = str_replace(["\r", "\n"], '', $email);
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'From: Sazvara Website <website@sazvara.ir>',
        'Reply-To: ' . $safeReply,
        'X-Sazvara-Intake-ID: ' . $id,
    ];

    $record['notification_attempted'] = true;
    $sent = false;

    # Local preview never sends mail or writes outside its preview process.
    $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
    $preview = str_starts_with($host, 'localhost') || str_starts_with($host, '127.0.0.1');

    if (!$preview && function_exists('mail')) {
        $sent = @mail(SAZVARA_RECIPIENT, $subject, $body, implode("\r\n", $headers));
    }

    $record['notification_sent'] = $sent;
    @file_put_contents($path, json_encode($record, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
    @chmod($path, 0600);

    finish_redirect($lang, $sent ? 'sent=1' : 'queued=1');

} catch (Throwable $e) {
    error_log('sazvara_intake_error=' . $e->getMessage());
    finish_redirect($lang, 'error=server');
}
