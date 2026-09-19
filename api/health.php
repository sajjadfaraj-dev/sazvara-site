<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
$docroot = rtrim((string) ($_SERVER['DOCUMENT_ROOT'] ?? ''), DIRECTORY_SEPARATOR);
$parent = $docroot !== '' ? dirname($docroot) : '';
$queue = $parent !== '' ? $parent . DIRECTORY_SEPARATOR . '.sazvara-intake' : '';
$queueReady = false;
if ($queue !== '') {
    if (is_dir($queue)) $queueReady = is_writable($queue);
    else $queueReady = is_writable($parent);
}
echo json_encode([
  'status' => ($queueReady && function_exists('mail')) ? 'ok' : 'attention',
  'private_queue_ready' => $queueReady,
  'mail_callable' => function_exists('mail'),
], JSON_UNESCAPED_SLASHES);
