-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Tempo de geração: 08/01/2026 às 17:46
-- Versão do servidor: 11.8.3-MariaDB-log
-- Versão do PHP: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `u103839941_faturas`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `administradores`
--

CREATE TABLE `administradores` (
  `id` int(11) NOT NULL,
  `usuario` varchar(255) NOT NULL,
  `senha` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `administradores`
--

INSERT INTO `administradores` (`id`, `usuario`, `senha`) VALUES
(3, 'Homolog', '$2y$10$DGZT4cglDROKuGFH/wDcDeQwUNDI8lAUk.g/sRb7c3BQbN6tE/dEm');

-- --------------------------------------------------------

--
-- Estrutura para tabela `clientes`
--

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `documento` varchar(20) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `data_cadastro` timestamp NULL DEFAULT current_timestamp(),
  `integrador_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `clientes`
--

INSERT INTO `clientes` (`id`, `nome`, `documento`, `telefone`, `data_cadastro`, `integrador_id`) VALUES
(35, 'Edmilson', '6848421847319813212', '818449184', '2025-10-20 18:51:13', 19),
(36, 'ENERGY GREEN ENERGIA SUSTENTAVEL LTDA', '482448570001-83', '', '2025-10-21 14:09:38', 19),
(45, 'FLAVIO FELIPE PEREIRA ALVES', '46.967.661/0001-91', '', '2025-10-30 13:51:29', 22),
(46, 'KI YOUNG PERFUMARIA LTDA', '14.237.557/0001-55', '', '2025-10-30 14:30:46', 23),
(47, 'Clóvis ', '38820871/0001-24', '', '2025-11-03 13:12:18', 24),
(49, 'Clóvis ', '38.820.871/0001-24', '', '2025-11-03 13:14:31', 25),
(50, 'Patrícia ', '25275381/0001-42', '', '2025-11-03 13:58:08', 26);

-- --------------------------------------------------------

--
-- Estrutura para tabela `cliente_enderecos`
--

CREATE TABLE `cliente_enderecos` (
  `id` int(11) NOT NULL,
  `cliente_id` int(11) NOT NULL,
  `tipo_endereco` varchar(50) NOT NULL DEFAULT 'principal',
  `logradouro` varchar(255) DEFAULT NULL,
  `numero` varchar(20) DEFAULT NULL,
  `complemento` varchar(100) DEFAULT NULL,
  `bairro` varchar(100) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `estado` char(2) DEFAULT NULL,
  `cep` varchar(10) DEFAULT NULL,
  `observacoes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `faturas`
--

CREATE TABLE `faturas` (
  `id` int(11) NOT NULL,
  `cliente_id` int(11) NOT NULL,
  `instalacao_id` int(11) NOT NULL,
  `mes_referencia` date NOT NULL,
  `data_emissao` date NOT NULL,
  `data_vencimento` date NOT NULL,
  `valor_total` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) DEFAULT 0.00,
  `valor_desconto` decimal(10,2) DEFAULT 0.00,
  `taxa_minima` decimal(10,2) DEFAULT 0.00,
  `valor_consumo` decimal(10,2) DEFAULT 0.00,
  `percentual_desconto` int(3) DEFAULT 0,
  `creditos` decimal(10,2) DEFAULT 0.00,
  `status` enum('pendente','paga','vencida','cancelada') DEFAULT 'pendente',
  `observacoes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `faturas`
--

INSERT INTO `faturas` (`id`, `cliente_id`, `instalacao_id`, `mes_referencia`, `data_emissao`, `data_vencimento`, `valor_total`, `subtotal`, `valor_desconto`, `taxa_minima`, `valor_consumo`, `percentual_desconto`, `creditos`, `status`, `observacoes`) VALUES
(38, 36, 30, '2025-09-01', '2025-10-23', '2025-10-16', 180.54, 204.84, 24.30, 123.84, 0.00, 30, 0.00, 'pendente', NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `fatura_itens`
--

CREATE TABLE `fatura_itens` (
  `id` int(11) NOT NULL,
  `fatura_id` int(11) NOT NULL,
  `descricao` varchar(255) NOT NULL,
  `quantidade_kwh` decimal(10,2) DEFAULT NULL,
  `valor_unitario` decimal(10,4) DEFAULT NULL,
  `valor_total_item` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `instalacoes`
--

CREATE TABLE `instalacoes` (
  `id` int(11) NOT NULL,
  `cliente_id` int(11) NOT NULL,
  `integrador_id` int(11) DEFAULT NULL,
  `codigo_uc` varchar(100) NOT NULL,
  `endereco_instalacao` text NOT NULL,
  `tipo_de_ligacao` varchar(20) DEFAULT 'Monofásica',
  `tipo_contrato` varchar(50) DEFAULT 'Monitoramento',
  `tipo_instalacao` varchar(50) DEFAULT 'Beneficiária',
  `regra_faturamento` varchar(50) NOT NULL DEFAULT 'Depois da Taxação',
  `saldo_creditos_kwh` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('ativa','inativa','pendente') DEFAULT 'ativa'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `instalacoes`
--

INSERT INTO `instalacoes` (`id`, `cliente_id`, `integrador_id`, `codigo_uc`, `endereco_instalacao`, `tipo_de_ligacao`, `tipo_contrato`, `tipo_instalacao`, `regra_faturamento`, `saldo_creditos_kwh`, `status`) VALUES
(29, 35, 19, '70000481278121', 'rua Nova casao ', 'Monofásica', 'Investimento', 'Geradora', 'Antes da Taxação', 0.00, 'ativa'),
(30, 36, 19, '8166043', 'ROD BR 408 678 LO NOVO PAUDALHO  QD- 3 CHA DE CAPOEIRA/PAUDALHO 55825-000 PAUDALHO PE', 'Trifásica', 'Investimento', 'Geradora', 'Depois da Taxação', 0.00, 'ativa'),
(35, 36, 19, '4244622', 'RUA ANTONIO DE CASTRO 175 . AP-2402 CASA AMARELA/RECIFE 52070-080 RECIFE PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(36, 36, 19, '2852732', 'RUA ANTONIO DE CASTRO 175 . CASA AMARELA/RECIFE 52070-080 RECIFE P', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(37, 36, 19, '210725', 'SI BAIXIO DOS BATISTAS 1400 ARARIPINA RURAL/ARARIPINA RURAL 56280-000 ARARIPINA PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(38, 36, 19, '183676', ' GENEZIO PEREIRA DE MELO 50 CENTRO/ARARIPINA 56280-000 ARARIPINA PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(39, 36, 19, '2709592', 'A URIEL DE HOLANDA 1043 BEBERIBE/RECIFE 52131-150 RECIFE PE', 'Monofásica', 'Investimento', 'Geradora', 'Depois da Taxação', 0.00, 'ativa'),
(40, 36, 19, '2088308', ' VASCO RODRIGUES 300  AP-104 PO O PEIXINHOS/OLINDA 53220-375 OLINDA PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(41, 36, 19, '5216122', 'A ANTONIO LINO DA SILVA 200  CS- 12 PRIV  SOLAR CHEVERNY II SANTANA/GRAVATA 50000-000 GRAVATA PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(42, 36, 19, '2858247', 'A IRMA MARIA DAVID 67 CASA FORTE/RECIFE 52061-070 RECIFE PE', 'Monofásica', 'Investimento', 'Geradora', 'Depois da Taxação', 0.00, 'ativa'),
(43, 36, 19, '2858410', 'A IRMA MARIA DAVID 154 * AP-1402 EDF MARIA DIVA CASA FORTE/RECIFE 52061-070 RECIFE PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(44, 36, 19, '2860470', 'AL RONDON 120  AP-101 EDF ARIANO SUASSUNA CASA FORTE/RECIFE 52061-055 RECIFE PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(45, 45, 22, '8254274', 'ENTO E DEZESSEIS 75 --C JARDIM MARANGUAPE/MARANGUAPE 53442-170 PAULISTA PE', 'Monofásica', 'Investimento', 'Geradora', 'Depois da Taxação', 0.00, 'ativa'),
(46, 45, 22, '6010162', 'NTO E DEZESEIS 75  CS- A MARANGUAPE/MARANGUAPE 53442-170 PAULISTA PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(47, 45, 22, '2106358', ' E 8 IV ETAPA RIO DOCE/OLINDA 53080-230 OLINDA PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(48, 45, 22, '2108555', 'AO JOSE 20 RIO DOCE/OLINDA 53070-530 OLINDA PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(49, 45, 22, '6939324', ' ZEZITO COSTA REGO 246 -PR CD- VARZEA/RECIFE 50740-010 RECIFE PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(50, 45, 22, '4087992', 'VENTA E SETE 140 B MARANGUAPE I/MARANGUAPE 53400-000 PAULISTA PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(51, 45, 22, '2392874', 'OVENTA E SETE 140 L0009 MARANGUAPE I/MARANGUAPE 53400-000 PAULISTA PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(52, 45, 22, '8155733', ' ORLANDO ALVES DE SOUZA 224  CS-B JARDIM MARANGUAPE/MARANGUAPE 53442-120 PAULISTA PE', 'Monofásica', 'Investimento', 'Geradora', 'Depois da Taxação', 0.00, 'ativa'),
(53, 45, 22, '7138069', ' C1 1  CD- 50 RIO DOCE/OLINDA 53150-050 OLINDA PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(54, 45, 22, '9313173', 'UA CENTO E DESSESEIS 166  CS-B MARANGUAPE I/MARANGUAPE 53442-170 PAULISTA PE', 'Monofásica', 'Investimento', 'Geradora', 'Depois da Taxação', 0.00, 'ativa'),
(55, 45, 22, '2387299', 'O E DESSESEIS 75 MARANGUAPE I/MARANGUAPE 53442-170 PAULISTA PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(56, 45, 22, '2387266', ' CENTO E DESSESEIS 166 MARANGUAPE I/MARANGUAPE 53442-170 PAULISTA PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(57, 46, 23, '2362375', 'BIGAIL BASTOS RUSSEL 365 PTE 19 189 N SA DO O/PAU AMARELO 53431-495 PAULISTA PE', 'Monofásica', 'Investimento', 'Geradora', 'Depois da Taxação', 0.00, 'ativa'),
(58, 46, 23, '8184843', 'CARLOS DE LIMA CAVALCANTE 61  LJ-4B BAIRRO NOVO/OLINDA 53030-260 OLINDA PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(59, 46, 23, '3219229', 'VEIRA DE CARVALHO 71  AP-401 CONDOMINIO EDF VIA ROMANA TAMARINEIRA/RECIFE 52110-060 RECIFE PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(60, 49, 25, '6331492', ' PARALELA A PRES KENNEDY CANDEIAS/PRAZERES 54430-331 JABOATAO DOS GUARARAPES PE', 'Monofásica', 'Investimento', 'Geradora', 'Depois da Taxação', 0.00, 'ativa'),
(61, 49, 25, '5571951', 'RUA PE CARAPUCEIRO 821  AP- 1702 EVOLUTION  TO- SKY PARK BOA VIAGEM/RECIFE 51020-280 RECIFE PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(62, 49, 25, '2766413', 'UA PAULO SETUBAL 79 BOA VIAGEM/RECIFE 51011-520 RECIFE PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(63, 49, 25, '1291684', 'RIVE ELDORADO II 4 PRIVE ELDORADO/GRAVATA 55640-000 GRAVATA PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(64, 49, 25, '2712634', 'UA ALM BATISTA LEAO 81 CRECHE BOA VIAGEM/RECIFE 51030-660 RECIFE PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(65, 49, 25, '6311479', ' RUA GAL SALGADO 476  AP- 1202 SETUBAL/RECIFE 51130-320 REC', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(66, 50, 26, '2376538', 'A SETENTA E NOVE 324 JARDIM PAULISTA/NAVARRO 53409-050 PAULISTA PE', 'Monofásica', 'Investimento', 'Geradora', 'Depois da Taxação', 0.00, 'ativa'),
(67, 50, 26, '7202186', 'ENTO E DEZESSEIS 64 JARDIM PAULISTA/NAVARRO 53407-010 PAULISTA PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(68, 50, 26, '3138472', ' PE LEMOS 372 NOVA DESCOBERTA/RECIFE 52070-200 RECIFE P', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa'),
(69, 50, 26, '2844713', 'R TOME DIAS 88 CASA AMARELA/RECIFE 52070-370 RECIFE PE', 'Monofásica', 'Investimento', 'Beneficiária', 'Depois da Taxação', 0.00, 'ativa');

-- --------------------------------------------------------

--
-- Estrutura para tabela `integradores`
--

CREATE TABLE `integradores` (
  `id` int(11) NOT NULL,
  `nome_do_integrador` varchar(255) NOT NULL,
  `numero_de_contato` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `integradores`
--

INSERT INTO `integradores` (`id`, `nome_do_integrador`, `numero_de_contato`) VALUES
(19, 'Energygree', '81949475819'),
(22, 'Homolog', '81999046595'),
(23, 'Ki Young ', '81994648163'),
(25, 'TR Construções', '81999262000'),
(26, 'Comercial Alimentos Zona Norte  ', '81999754031');

-- --------------------------------------------------------

--
-- Estrutura para tabela `leituras_medidor`
--

CREATE TABLE `leituras_medidor` (
  `id` int(11) NOT NULL,
  `instalacao_id` int(11) NOT NULL,
  `mes_referencia` date NOT NULL,
  `consumo_kwh` decimal(10,2) NOT NULL,
  `injecao_kwh` decimal(10,2) NOT NULL,
  `data_leitura` date NOT NULL,
  `numero_dias` int(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `leituras_medidor`
--

INSERT INTO `leituras_medidor` (`id`, `instalacao_id`, `mes_referencia`, `consumo_kwh`, `injecao_kwh`, `data_leitura`, `numero_dias`) VALUES
(26, 30, '2025-09-01', 81.00, 5031.00, '2025-09-12', 30);

--
-- Acionadores `leituras_medidor`
--
DELIMITER $$
CREATE TRIGGER `trg_atualiza_creditos_apos_leitura` AFTER INSERT ON `leituras_medidor` FOR EACH ROW BEGIN
    DECLARE v_delta_kwh DECIMAL(10,2);

    -- Calcula a variação de créditos (Injeção - Consumo)
    SET v_delta_kwh = NEW.injecao_kwh - NEW.consumo_kwh;

    -- Atualiza o saldo de créditos na tabela 'instalacoes'
    UPDATE `instalacoes`
    SET `saldo_creditos_kwh` = `saldo_creditos_kwh` + v_delta_kwh
    WHERE `id` = NEW.instalacao_id;
END
$$
DELIMITER ;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `administradores`
--
ALTER TABLE `administradores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario` (`usuario`);

--
-- Índices de tabela `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `documento` (`documento`);

--
-- Índices de tabela `cliente_enderecos`
--
ALTER TABLE `cliente_enderecos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cliente_id` (`cliente_id`);

--
-- Índices de tabela `faturas`
--
ALTER TABLE `faturas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cliente_id` (`cliente_id`),
  ADD KEY `instalacao_id` (`instalacao_id`);

--
-- Índices de tabela `fatura_itens`
--
ALTER TABLE `fatura_itens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fatura_id` (`fatura_id`);

--
-- Índices de tabela `instalacoes`
--
ALTER TABLE `instalacoes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo_uc` (`codigo_uc`),
  ADD KEY `cliente_id` (`cliente_id`),
  ADD KEY `fk_instalacoes_integradores` (`integrador_id`);

--
-- Índices de tabela `integradores`
--
ALTER TABLE `integradores`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `leituras_medidor`
--
ALTER TABLE `leituras_medidor`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `instalacao_id` (`instalacao_id`,`mes_referencia`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `administradores`
--
ALTER TABLE `administradores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT de tabela `cliente_enderecos`
--
ALTER TABLE `cliente_enderecos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `faturas`
--
ALTER TABLE `faturas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT de tabela `fatura_itens`
--
ALTER TABLE `fatura_itens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `instalacoes`
--
ALTER TABLE `instalacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT de tabela `integradores`
--
ALTER TABLE `integradores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de tabela `leituras_medidor`
--
ALTER TABLE `leituras_medidor`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `cliente_enderecos`
--
ALTER TABLE `cliente_enderecos`
  ADD CONSTRAINT `fk_cliente_endereco` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `faturas`
--
ALTER TABLE `faturas`
  ADD CONSTRAINT `faturas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  ADD CONSTRAINT `faturas_ibfk_2` FOREIGN KEY (`instalacao_id`) REFERENCES `instalacoes` (`id`);

--
-- Restrições para tabelas `fatura_itens`
--
ALTER TABLE `fatura_itens`
  ADD CONSTRAINT `fatura_itens_ibfk_1` FOREIGN KEY (`fatura_id`) REFERENCES `faturas` (`id`);

--
-- Restrições para tabelas `instalacoes`
--
ALTER TABLE `instalacoes`
  ADD CONSTRAINT `fk_instalacoes_integradores` FOREIGN KEY (`integrador_id`) REFERENCES `integradores` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `instalacoes_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`);

--
-- Restrições para tabelas `leituras_medidor`
--
ALTER TABLE `leituras_medidor`
  ADD CONSTRAINT `leituras_medidor_ibfk_1` FOREIGN KEY (`instalacao_id`) REFERENCES `instalacoes` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
