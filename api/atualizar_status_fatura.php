<?php
// faturas/api/atualizar_status_fatura.php

// 1. Configurações de Erro (para debug, remova em produção)
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 2. Cabeçalhos CORS (Essenciais para resolver o seu erro)
header("Access-Control-Allow-Origin: *"); // Permite qualquer origem (ou coloque http://localhost:5173)
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS"); // Permite POST e OPTIONS
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// 3. Tratamento da Requisição "Preflight" (OPTIONS)
// O navegador manda isso antes do POST. Se não responder 200 e sair, dá erro.
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'Database.php';

// 4. Recebimento dos Dados
$data = json_decode(file_get_contents("php://input"));

// Verifica se os dados chegaram
if (!empty($data->id) && !empty($data->status)) {
    try {
        $database = Database::getInstance();
        $pdo = $database->getConnection();
        
        // Atualiza o status
        $sql = "UPDATE faturas SET status = :status WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        
        $stmt->bindParam(':status', $data->status);
        $stmt->bindParam(':id', $data->id);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(["message" => "Status atualizado com sucesso."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Não foi possível atualizar o status."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Erro de banco de dados: " . $e->getMessage()]);
    }
} else {
    // Dados incompletos
    http_response_code(400);
    echo json_encode(["message" => "Dados incompletos. ID e Status são obrigatórios."]);
}
?>