<?php
// faturas/api/get_instalacoes_por_cliente.php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

$configFile = __DIR__ . '/../config.php';
$config = require $configFile;
$pdo = new PDO("mysql:host={$config['db_host']};dbname={$config['db_name']};charset=utf8", $config['db_user'], $config['db_pass']);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

if (empty($_GET['cliente_id'])) {
    http_response_code(400);
    echo json_encode(['message' => 'O ID do cliente é obrigatório.']);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT id, codigo_uc, endereco_instalacao 
        FROM instalacoes 
        WHERE cliente_id = ?
        ORDER BY id
    ");
    $stmt->execute([$_GET['cliente_id']]);
    $instalacoes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($instalacoes);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erro ao listar instalações.']);
}
?>