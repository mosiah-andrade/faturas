<?php
// delete_integrador.php

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'Database.php';

try {
    $database = Database::getInstance();
    $pdo = $database->getConnection();

    if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
        http_response_code(405);
        echo json_encode(['message' => 'Método não permitido. Utilize DELETE.']);
        exit();
    }

    if (empty($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['message' => 'ID do integrador é obrigatório.']);
        exit();
    }

    $id = $_GET['id'];
    $sql = "DELETE FROM integradores WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    
    $stmt->execute([$id]);
    
    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode(['message' => 'Integrador deletado com sucesso!']);
    } else {
        http_response_code(404);
        echo json_encode(['message' => 'Integrador não encontrado.']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erro ao deletar integrador no DB.', 'details' => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erro no servidor.', 'details' => $e->getMessage()]);
}
?>