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

    // Validação (Campos do cliente + campos da primeira instalação)
    if (
        // Dados do Cliente
        empty($data->nome) ||
        empty($data->documento) ||
        
        // O VÍNCULO OBRIGATÓRIO
        empty($data->integrador_id) 
    ) {
        http_response_code(400);
        echo json_encode(['message' => 'Todos os campos obrigatórios (Nome, Documento, Código UC, Endereço e Integrador) devem ser preenchidos.']);
        exit();
    }

    $pdo->beginTransaction();

    // 1. Inserção na tabela 'clientes'
    $sqlCliente = "INSERT INTO clientes (
                        nome, documento, telefone, email, endereco, 
                        cidade_estado, cep, data_nascimento
                   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmtCliente = $pdo->prepare($sqlCliente);
    $stmtCliente->execute([
        $data->nome, 
        $data->documento, 
        $data->telefone ?? null,
        $data->email ?? null,
        $data->endereco_cliente ?? null,
        $data->cidade_estado ?? null,
        $data->cep ?? null,
        $data->data_nascimento ?? null
    ]);
    
    // Pega o ID do cliente que acabou de ser criado
    $clienteId = $pdo->lastInsertId();

    // 2. Inserção na tabela 'instalacoes' (A PRIMEIRA INSTALAÇÃO)
    //    É ISSO QUE CRIA O VÍNCULO
    $sqlInstalacao = "INSERT INTO instalacoes (
                        cliente_id, integrador_id, codigo_uc, endereco_instalacao, 
                        tipo_contrato, tipo_instalacao, regra_faturamento
                      ) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmtInstalacao = $pdo->prepare($sqlInstalacao);
    $stmtInstalacao->execute([
        $clienteId,             // O ID que acabamos de criar
        $data->integrador_id,   // O ID do integrador (agora validado)
        $data->codigo_uc, 
        $data->endereco_instalacao, 
        $data->tipo_contrato ?? 'Monofásico',
        $data->tipo_instalacao ?? 'Geradora',
        $data->regra_faturamento ?? 'geracao'
    ]);

    $pdo->commit();

    http_response_code(201);
    echo json_encode([
        'message' => 'Cliente e instalação inicial cadastrados com sucesso!',
        'cliente_id' => $clienteId
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    if ($e->getCode() == 23000) {
        // Verifica se o erro é no documento ou na UC
        if (strpos($e->getMessage(), 'documento') !== false) {
             echo json_encode(['message' => 'Erro: Documento (CPF/CNPJ) já existe no sistema.']);
        } elseif (strpos($e->getMessage(), 'codigo_uc') !== false) {
             echo json_encode(['message' => 'Erro: Código da UC já existe no sistema.']);
        } else {
             echo json_encode(['message' => 'Erro: Violação de chave única. Verifique os dados.']);
        }
    } else {
        echo json_encode(['message' => 'Erro interno ao cadastrar cliente.', 'details' => $e->getMessage()]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Erro no servidor.', 'details' => $e->getMessage()]);
}
?>