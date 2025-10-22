<?php
// faturas/api/cadastrar_cliente.php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'Database.php';

try {
    $database = Database::getInstance();
    $pdo = $database->getConnection();
    
    $data = json_decode(file_get_contents("php://input"));

    // --- MUDANÇA: Validação apenas para CLIENTE ---
    if (empty($data->nome) || empty($data->documento)) {
        http_response_code(400);
        echo json_encode(['message' => 'Nome e Documento (CPF/CNPJ) são obrigatórios.']);
        exit();
    }

    $pdo->beginTransaction();

    // --- MUDANÇA: Inserção APENAS na tabela 'clientes' ---
    $sqlCliente = "INSERT INTO clientes (nome, documento, telefone) VALUES (?, ?, ?)";
    $stmtCliente = $pdo->prepare($sqlCliente);
    $stmtCliente->execute([
        $data->nome, 
        $data->documento, 
        $data->telefone ?? null
    ]);
    $clienteId = $pdo->lastInsertId();

    // --- REMOVIDO: Bloco de inserção da 'instalacao' ---

    $pdo->commit();

    http_response_code(201);
    echo json_encode([
        'message' => 'Cliente cadastrado com sucesso!',
        'cliente_id' => $clienteId // Retorna o ID para o frontend
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    if ($e->getCode() == 23000) {
        // Agora o único erro de duplicidade possível é o documento
        echo json_encode(['message' => 'Erro: Documento (CPF/CNPJ) já existe no sistema.']);
    } else {
        echo json_encode(['message' => 'Erro interno ao cadastrar cliente.', 'details' => $e->getMessage()]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erro no servidor.', 'details' => $e->getMessage()]);
}
?>