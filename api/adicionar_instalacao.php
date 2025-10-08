<?php
// faturas/api/adicionar_instalacao.php

ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$configFile = __DIR__ . '/../config.php';
$config = require $configFile;

try {
    $pdo = new PDO("mysql:host={$config['db_host']};dbname={$config['db_name']};charset=utf8", $config['db_user'], $config['db_pass']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode(['message' => 'FALHA NA CONEXÃO COM O BANCO.', 'details' => $e->getMessage()]));
}

$data = json_decode(file_get_contents("php://input"));

// Validação dos dados de entrada
if (
    empty($data->cliente_id) ||
    empty($data->integrador_id) ||
    empty($data->codigo_uc) ||
    empty($data->endereco_instalacao)
) {
    http_response_code(400);
    die(json_encode(['message' => 'Todos os campos são obrigatórios.']));
}

try {
    $sql = "INSERT INTO instalacoes (cliente_id, integrador_id, codigo_uc, endereco_instalacao) VALUES (?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$data->cliente_id, $data->integrador_id, $data->codigo_uc, $data->endereco_instalacao]);

    http_response_code(201);
    echo json_encode([
        'message' => 'Nova instalação adicionada com sucesso!',
        'instalacao_id' => $pdo->lastInsertId()
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    if ($e->getCode() == 23000) { // Erro de chave duplicada
        die(json_encode(['message' => 'Erro: O Código da Unidade Consumidora (UC) já existe.']));
    } else {
        die(json_encode(['message' => 'Erro ao adicionar instalação.', 'details' => $e->getMessage()]));
    }
}
?>