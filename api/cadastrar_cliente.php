<?php
// faturas/api/cadastrar_cliente.php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
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

    // Validação sem o campo de e-mail
    if (
        empty($data->integrador_id) || empty($data->nome) || empty($data->documento) || 
        empty($data->codigo_uc) || empty($data->endereco_instalacao) ||
        !isset($data->valor_tusd) || !isset($data->valor_te) ||
        empty($data->tipo_contrato) || empty($data->tipo_instalacao)
    ) {
        http_response_code(400);
        echo json_encode(['message' => 'Todos os campos obrigatórios devem ser preenchidos.']);
        exit();
    }

    $pdo->beginTransaction();

    // Inserção na tabela 'clientes' sem o e-mail
    $sqlCliente = "INSERT INTO clientes (nome, documento, telefone, endereco_cobranca) VALUES (?, ?, ?, ?)";
    $stmtCliente = $pdo->prepare($sqlCliente);
    $stmtCliente->execute([$data->nome, $data->documento, $data->telefone ?? null, $data->endereco_instalacao]);
    $clienteId = $pdo->lastInsertId();

    // Inserção na tabela 'instalacoes' (sem alteração nesta parte)
    $sqlInstalacao = "INSERT INTO instalacoes (
                        cliente_id, integrador_id, codigo_uc, endereco_instalacao, tipo_de_ligacao, 
                        valor_tusd, valor_te, tipo_contrato, tipo_instalacao
                      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmtInstalacao = $pdo->prepare($sqlInstalacao);
    $stmtInstalacao->execute([
        $clienteId, 
        $data->integrador_id, 
        $data->codigo_uc, 
        $data->endereco_instalacao, 
        $data->tipo_de_ligacao ?? 'Monofásica',
        (float)($data->valor_tusd ?? 0),
        (float)($data->valor_te ?? 0),
        $data->tipo_contrato ?? 'Monitoramento',
        $data->tipo_instalacao ?? 'Beneficiária'
    ]);

    $pdo->commit();

    http_response_code(201);
    echo json_encode([
        'message' => 'Cliente e instalação cadastrados com sucesso!',
        'cliente_id' => $clienteId
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    if ($e->getCode() == 23000) {
        echo json_encode(['message' => 'Erro: Documento (CPF/CNPJ) ou Código da UC já existe no sistema.']);
    } else {
        echo json_encode(['message' => 'Erro interno ao cadastrar cliente.', 'details' => $e->getMessage()]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erro no servidor.', 'details' => $e->getMessage()]);
}
?>