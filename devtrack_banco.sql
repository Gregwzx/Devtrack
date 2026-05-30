-- ================================================================
--  DevTrack — Banco Corrigido com INT AUTO_INCREMENT nas PKs
--  MySQL / XAMPP / phpMyAdmin
--  ATENÇÃO: Este script apaga e recria o banco do zero.
-- ================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;
SET time_zone = "-03:00";
SET NAMES utf8mb4;

DROP DATABASE IF EXISTS devtrack;
CREATE DATABASE devtrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE devtrack;

-- ─────────────────────────────────────────────────────────────
-- 1. TABELAS
-- ─────────────────────────────────────────────────────────────

-- Áreas de estudo (lookup table — usa VARCHAR como PK pois é um código curto e fixo)
CREATE TABLE areas_estudo (
  id         VARCHAR(30)  NOT NULL,
  nome       VARCHAR(50)  NOT NULL,
  cor        VARCHAR(7)   NOT NULL DEFAULT '#6b7280',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuários
CREATE TABLE usuarios (
  id              INT          NOT NULL AUTO_INCREMENT,
  nome            VARCHAR(100) NOT NULL,
  email           VARCHAR(150) NOT NULL,
  senha_hash      VARCHAR(255) NOT NULL,
  foto_url        VARCHAR(500) DEFAULT NULL,
  bio             TEXT         DEFAULT NULL,
  cor_banner      VARCHAR(7)   DEFAULT '#1e293b',
  area_estudo_id  VARCHAR(30)  DEFAULT 'fullstack',
  vidas           INT          NOT NULL DEFAULT 5,
  criado_em       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email),
  KEY fk_usuarios_area (area_estudo_id),
  CONSTRAINT fk_usuarios_area FOREIGN KEY (area_estudo_id)
    REFERENCES areas_estudo (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exercícios
CREATE TABLE exercicios (
  id          INT          NOT NULL AUTO_INCREMENT,
  area_id     VARCHAR(30)  DEFAULT NULL,
  pergunta    TEXT         NOT NULL,
  resposta    TEXT         NOT NULL,
  tipo        ENUM('multipla_escolha','codigo','verdadeiro_falso','completar')
              NOT NULL DEFAULT 'multipla_escolha',
  dificuldade ENUM('facil','medio','dificil') NOT NULL DEFAULT 'facil',
  PRIMARY KEY (id),
  KEY fk_exercicios_area (area_id),
  CONSTRAINT fk_exercicios_area FOREIGN KEY (area_id)
    REFERENCES areas_estudo (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Aprendizados registrados pelo usuário
CREATE TABLE aprendizados (
  id          INT          NOT NULL AUTO_INCREMENT,
  usuario_id  INT          NOT NULL,
  texto       TEXT         NOT NULL,
  area_id     VARCHAR(30)  DEFAULT NULL,
  tipo        VARCHAR(30)  DEFAULT 'conceito',
  criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY fk_aprendizados_usuario (usuario_id),
  KEY fk_aprendizados_area    (area_id),
  CONSTRAINT fk_aprendizados_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE,
  CONSTRAINT fk_aprendizados_area FOREIGN KEY (area_id)
    REFERENCES areas_estudo (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tags/stacks de cada aprendizado
CREATE TABLE aprendizado_tags (
  aprendizado_id INT         NOT NULL,
  tag            VARCHAR(50) NOT NULL,
  PRIMARY KEY (aprendizado_id, tag),
  CONSTRAINT fk_tags_aprendizado FOREIGN KEY (aprendizado_id)
    REFERENCES aprendizados (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sequência de estudos (streak)
CREATE TABLE sequencias (
  id          INT  NOT NULL AUTO_INCREMENT,
  usuario_id  INT  NOT NULL,
  contagem    INT  NOT NULL DEFAULT 0,
  ultima_data DATE DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sequencia_usuario (usuario_id),
  CONSTRAINT fk_sequencias_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Paradas da trilha de aprendizado
CREATE TABLE paradas_trilha (
  id          INT          NOT NULL AUTO_INCREMENT,
  area_id     VARCHAR(30)  NOT NULL,
  ordem       INT          NOT NULL,
  titulo      VARCHAR(100) NOT NULL,
  subtitulo   VARCHAR(150) DEFAULT NULL,
  cor         VARCHAR(7)   DEFAULT '#6b7280',
  nivel       ENUM('basico','intermediario','avancado') NOT NULL DEFAULT 'basico',
  xp_recompensa INT        NOT NULL DEFAULT 50,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ordem_parada (area_id, ordem),
  CONSTRAINT fk_paradas_area FOREIGN KEY (area_id)
    REFERENCES areas_estudo (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relação entre paradas e exercícios (tabela de junção N:N)
CREATE TABLE parada_exercicios (
  parada_id    INT NOT NULL,
  exercicio_id INT NOT NULL,
  PRIMARY KEY (parada_id, exercicio_id),
  KEY fk_pe_exercicio (exercicio_id),
  CONSTRAINT fk_pe_parada    FOREIGN KEY (parada_id)    REFERENCES paradas_trilha (id) ON DELETE CASCADE,
  CONSTRAINT fk_pe_exercicio FOREIGN KEY (exercicio_id) REFERENCES exercicios (id)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Progresso do usuário nas paradas
CREATE TABLE progresso_trilha (
  usuario_id  INT      NOT NULL,
  parada_id   INT      NOT NULL,
  concluido_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  xp_ganho    INT      NOT NULL DEFAULT 0,
  PRIMARY KEY (usuario_id, parada_id),
  KEY fk_progresso_parada (parada_id),
  CONSTRAINT fk_progresso_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)       ON DELETE CASCADE,
  CONSTRAINT fk_progresso_parada  FOREIGN KEY (parada_id)  REFERENCES paradas_trilha (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 2. DADOS DE EXEMPLO
-- ─────────────────────────────────────────────────────────────

INSERT INTO areas_estudo (id, nome, cor) VALUES
('backend',   'Backend',   '#10b981'),
('devops',    'DevOps',    '#e879f9'),
('frontend',  'Frontend',  '#06b6d4'),
('fullstack', 'Fullstack', '#8b5cf6'),
('mobile',    'Mobile',    '#f59e0b'),
('seguranca', 'Seguranca', '#ef4444');

-- Exercícios (id = INT AUTO_INCREMENT — começa em 1)
INSERT INTO exercicios (area_id, pergunta, resposta, tipo, dificuldade) VALUES
('frontend',  'Qual tag HTML define o maior titulo da pagina?',          'A tag h1 define o titulo de maior hierarquia.', 'multipla_escolha', 'facil'),   -- id=1
('frontend',  'O que e o box model no CSS?',                              'Define como elementos sao renderizados: content, padding, border e margin.', 'multipla_escolha', 'facil'),  -- id=2
('frontend',  'Para que serve o display flex?',                           'Cria layouts flexiveis em uma dimensao.', 'multipla_escolha', 'medio'),           -- id=3
('frontend',  'Qual hook do React e usado para efeitos colaterais?',      'useEffect — executa codigo apos a renderizacao.', 'multipla_escolha', 'medio'),   -- id=4
('backend',   'Qual metodo HTTP e usado para criar um recurso?',          'POST — envia dados para criar novo recurso.', 'multipla_escolha', 'facil'),        -- id=5
('backend',   'Qual status HTTP para recurso nao encontrado?',            '404 Not Found.', 'multipla_escolha', 'facil'),                                    -- id=6
('backend',   'O que e JWT?',                                             'JSON Web Token — padrao de autenticacao segura.', 'multipla_escolha', 'medio'),   -- id=7
('backend',   'O que e uma API RESTful?',                                 'API que segue os principios REST: stateless, recursos por URIs.', 'multipla_escolha', 'medio'), -- id=8
('mobile',    'Qual componente substitui div no React Native?',           'View — equivalente da div no React Native.', 'multipla_escolha', 'facil'),         -- id=9
('mobile',    'Qual componente e usado para listas no React Native?',     'FlatList — renderiza listas com virtualizacao.', 'multipla_escolha', 'facil'),     -- id=10
('mobile',    'Para que serve o AsyncStorage?',                           'Persistir dados simples no dispositivo como chave-valor.', 'multipla_escolha', 'medio'), -- id=11
('mobile',    'O que e o Expo?',                                          'Framework para React Native que simplifica o desenvolvimento.', 'multipla_escolha', 'facil'), -- id=12
('fullstack', 'O que e uma variavel?',                                    'Espaco na memoria com nome que armazena um valor.', 'multipla_escolha', 'facil'),  -- id=13
('fullstack', 'Diferenca entre == e === no JavaScript?',                  '== compara com coercao de tipo; === compara valor e tipo.', 'multipla_escolha', 'facil'), -- id=14
('fullstack', 'O que e a 1FN (Primeira Forma Normal)?',                   'Garante que cada coluna tenha valores atomicos.', 'multipla_escolha', 'medio'),   -- id=15
('fullstack', 'O que e uma chave estrangeira (FK)?',                      'Coluna que referencia a PK de outra tabela.', 'multipla_escolha', 'facil'),       -- id=16
('devops',    'Qual comando cria um novo repositorio Git?',               'git init — inicializa um repositorio Git vazio.', 'multipla_escolha', 'facil'),   -- id=17
('devops',    'Qual comando envia commits para o repositorio remoto?',    'git push — envia commits locais para o remoto.', 'multipla_escolha', 'facil'),    -- id=18
('devops',    'O que faz o git merge?',                                   'Combina o historico de dois branches em um so.', 'multipla_escolha', 'medio'),    -- id=19
('backend',   'O que e um endpoint?',                                     'URL especifica de uma API que aceita requisicoes.', 'multipla_escolha', 'facil'); -- id=20

-- Paradas da trilha Frontend (ids 1–8)
INSERT INTO paradas_trilha (area_id, ordem, titulo, subtitulo, cor, nivel, xp_recompensa) VALUES
('frontend', 1, 'HTML e CSS',        'Estrutura e estilo',     '#06b6d4', 'basico',        40),
('frontend', 2, 'Layouts Modernos',  'Flexbox e Grid',         '#0891b2', 'basico',        50),
('frontend', 3, 'JavaScript Core',   'Logica e funcoes',       '#0e7490', 'basico',        60),
('frontend', 4, 'React Fundamentos', 'Componentes e hooks',    '#f59e0b', 'intermediario', 70),
('frontend', 5, 'Estado e Contexto', 'useState e Context',     '#d97706', 'intermediario', 80),
('frontend', 6, 'APIs no Frontend',  'Fetch e debounce',       '#b45309', 'intermediario', 90),
('frontend', 7, 'Performance',       'Memo e otimizacao',      '#8b5cf6', 'avancado',      110),
('frontend', 8, 'Arquitetura React', 'Patterns avancados',     '#7c3aed', 'avancado',      130);

-- Paradas da trilha Backend (ids 9–16)
INSERT INTO paradas_trilha (area_id, ordem, titulo, subtitulo, cor, nivel, xp_recompensa) VALUES
('backend', 1, 'HTTP Basico',      'Metodos e status',      '#10b981', 'basico',        40),
('backend', 2, 'Express e Rotas',  'Servidor e endpoints',  '#059669', 'basico',        50),
('backend', 3, 'CRUD Completo',    'Create Read Update',    '#047857', 'basico',        60),
('backend', 4, 'Banco de Dados',   'SQL e modelagem',       '#f59e0b', 'intermediario', 80),
('backend', 5, 'Autenticacao',     'JWT e middlewares',     '#d97706', 'intermediario', 90),
('backend', 6, 'APIs Avancadas',   'Paginacao e cache',     '#b45309', 'intermediario', 100),
('backend', 7, 'Performance SQL',  'Indices e queries',     '#8b5cf6', 'avancado',      120),
('backend', 8, 'Arquitetura',      'Clean e microsservicos','#7c3aed', 'avancado',      140);

-- Paradas da trilha Mobile (ids 17–24)
INSERT INTO paradas_trilha (area_id, ordem, titulo, subtitulo, cor, nivel, xp_recompensa) VALUES
('mobile', 1, 'RN Fundamentos',  'Views e estilo',       '#f59e0b', 'basico',        40),
('mobile', 2, 'Listas e Scroll', 'FlatList e scroll',    '#d97706', 'basico',        50),
('mobile', 3, 'Navegacao',       'Rotas e Stack',        '#b45309', 'basico',        60),
('mobile', 4, 'Estado e Hooks',  'useState e Context',   '#8b5cf6', 'intermediario', 75),
('mobile', 5, 'Persistencia',    'AsyncStorage e SQLite','#7c3aed', 'intermediario', 85),
('mobile', 6, 'APIs Mobile',     'Fetch e offline',      '#6d28d9', 'intermediario', 95),
('mobile', 7, 'Animacoes',       'Reanimated 3',         '#ef4444', 'avancado',      115),
('mobile', 8, 'Performance',     'Otimizacao nativa',    '#dc2626', 'avancado',      135);

-- Relação paradas × exercícios (usando IDs inteiros)
-- Frontend paradas 1-8 × exercícios 1-4 (frontend) e 13-14 (fullstack)
INSERT INTO parada_exercicios (parada_id, exercicio_id) VALUES
(1,1),(1,13),(1,14),   -- HTML e CSS
(2,2),(2,3),(2,13),    -- Layouts
(3,13),(3,14),(3,15),  -- JS Core
(4,1),(4,2),(4,3),     -- React
(5,4),(5,13),(5,14),   -- Estado
(6,20),(6,8),(6,16),   -- APIs Frontend
(7,4),(7,3),(7,14),    -- Performance
(8,3),(8,4),(8,8);     -- Arquitetura

-- Backend paradas 9-16 × exercícios 5-8 e 15-16 e 20
INSERT INTO parada_exercicios (parada_id, exercicio_id) VALUES
(9,5),(9,13),(9,14),   -- HTTP Basico
(10,6),(10,13),(10,15),(11,5),(11,6),(11,16),   -- Express e CRUD
(12,15),(12,16),(12,13),(13,7),(13,16),(13,15), -- BD e Auth
(14,8),(14,20),(14,16),(15,7),(15,6),(15,15),   -- APIs e SQL
(16,8),(16,7),(16,20); -- Arquitetura

-- Mobile paradas 17-24 × exercícios 9-12 e 13-14
INSERT INTO parada_exercicios (parada_id, exercicio_id) VALUES
(17,9),(17,13),(17,14),(18,10),(18,13),(18,15),
(19,9),(19,16),(19,1), (20,3),(20,4),(20,10),
(21,10),(21,20),(21,14),(22,20),(22,11),(22,12),
(23,12),(23,11),(23,8),(24,10),(24,14),(24,12);

-- Usuário de teste
INSERT INTO usuarios (nome, email, senha_hash, area_estudo_id, vidas) VALUES
('Estudante Teste', 'teste@devtrack.com', '$2a$12$hash_exemplo_aqui', 'fullstack', 5);

-- Sequência do usuário de teste (id do usuario = 1)
INSERT INTO sequencias (usuario_id, contagem, ultima_data) VALUES
(1, 7, CURRENT_DATE);

-- Aprendizado de teste
INSERT INTO aprendizados (usuario_id, texto, area_id, tipo) VALUES
(1, 'Aprendi que FlatList virtualiza itens e e muito mais performatica que ScrollView para listas longas', 'mobile', 'conceito');

-- Tag do aprendizado
INSERT INTO aprendizado_tags (aprendizado_id, tag) VALUES
(1, 'React Native'), (1, 'Performance');

-- Progresso na primeira parada (usuario 1 completou parada 1 — HTML e CSS)
INSERT INTO progresso_trilha (usuario_id, parada_id, xp_ganho) VALUES
(1, 1, 40);

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
