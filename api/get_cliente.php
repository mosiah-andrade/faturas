<?php
// faturas/api/get_cliente.php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 1. Incluir CORS para permitir o acesso do React (localhost:5173)
require_once 'cors.php';
require_once 'Database.php';

// 2. Validar o ID recebido na URL
$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

if (!$id) {
    http_response_code(400);
    echo json_encode(['message' => 'ID do cliente inválido ou não fornecido.']);
    exit();
}

try {
    $database = Database::getInstance();
    $pdo = $database->getConnection();

    // 3. Buscar os dados do cliente
    $sql = "SELECT * FROM clientes WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);
    
    $cliente = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$cliente) {
        http_response_code(404);
        echo json_encode(['message' => 'Cliente não encontrado.']);
        exit();
    }

    // 4. Retornar os dados
    http_response_code(200);
    echo json_encode($cliente);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erro no banco de dados.', 'details' => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erro no servidor.', 'details' => $e->getMessage()]);
}
?>