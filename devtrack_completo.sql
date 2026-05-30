-- ================================================================
--  DevTrack — Banco de Dados Completo e Normalizado (3FN)
--  MySQL 8.0+ / XAMPP
--  Como usar:
--    1. Abra o phpMyAdmin (http://localhost/phpmyadmin)
--    2. Selecione o banco "devtrack" (ou crie um se não existir)
--    3. Clique em "Importar", selecione este arquivo e execute.
-- ================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "-03:00";

/*!40101 SET NAMES utf8mb4 */;
SET CHARACTER SET utf8mb4;
SET character_set_connection = utf8mb4;

DROP DATABASE IF EXISTS devtrack;
CREATE DATABASE devtrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE devtrack;

-- ─────────────────────────────────────────────────────────────────
-- 1. ESTRUTURA DAS TABELAS
-- (Nomes das tabelas e colunas mantidos em inglês para não quebrar o código do Backend/Mobile)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE study_areas (
  id varchar(30) NOT NULL,
  label varchar(50) NOT NULL,
  color varchar(7) NOT NULL DEFAULT '#6b7280',
  icon varchar(10) NOT NULL DEFAULT '📚',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE app_users (
  id char(36) NOT NULL,
  name varchar(100) NOT NULL,
  email varchar(150) NOT NULL,
  password_hash varchar(255) NOT NULL,
  photo_url varchar(500) DEFAULT NULL,
  bio text DEFAULT NULL,
  banner_color varchar(7) DEFAULT '#1e293b',
  study_area_id varchar(30) DEFAULT 'fullstack',
  lives int(11) NOT NULL DEFAULT 5,
  lives_last_refill datetime DEFAULT NULL,
  created_at datetime NOT NULL DEFAULT current_timestamp(),
  updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY fk_users_area (study_area_id),
  CONSTRAINT fk_users_area FOREIGN KEY (study_area_id) REFERENCES study_areas (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE avatar_items (
  id char(36) NOT NULL,
  name varchar(100) NOT NULL,
  category varchar(30) NOT NULL,
  xp_cost int(11) NOT NULL DEFAULT 0,
  preview_url varchar(500) DEFAULT NULL,
  config_json longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(config_json)),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE exercises (
  id char(36) NOT NULL,
  area_id varchar(30) DEFAULT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  type enum('multiple_choice','code','true_false','fill_blank') NOT NULL DEFAULT 'multiple_choice',
  difficulty enum('easy','medium','hard') NOT NULL DEFAULT 'easy',
  PRIMARY KEY (id),
  KEY fk_exercises_area (area_id),
  CONSTRAINT fk_exercises_area FOREIGN KEY (area_id) REFERENCES study_areas (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE learnings (
  id char(36) NOT NULL,
  user_id char(36) NOT NULL,
  text text NOT NULL,
  area_id varchar(30) DEFAULT NULL,
  type varchar(30) DEFAULT 'concept',
  created_at datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY fk_learnings_user (user_id),
  KEY fk_learnings_area (area_id),
  CONSTRAINT fk_learnings_area FOREIGN KEY (area_id) REFERENCES study_areas (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_learnings_user FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE learning_stacks (
  learning_id char(36) NOT NULL,
  stack_name varchar(50) NOT NULL,
  PRIMARY KEY (learning_id,stack_name),
  CONSTRAINT fk_lstacks_learning FOREIGN KEY (learning_id) REFERENCES learnings (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE streaks (
  id char(36) NOT NULL,
  user_id char(36) NOT NULL,
  count int(11) NOT NULL DEFAULT 0,
  last_date date DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_streaks_user (user_id),
  CONSTRAINT fk_streaks_user FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE trail_stops (
  id char(36) NOT NULL,
  area_id varchar(30) NOT NULL,
  stop_order int(11) NOT NULL,
  title varchar(100) NOT NULL,
  subtitle varchar(150) DEFAULT NULL,
  icon varchar(10) DEFAULT NULL,
  color varchar(7) DEFAULT '#6b7280',
  level enum('basic','intermediate','advanced') NOT NULL DEFAULT 'basic',
  xp_reward int(11) NOT NULL DEFAULT 50,
  PRIMARY KEY (id),
  UNIQUE KEY uq_stop_order (area_id,stop_order),
  CONSTRAINT fk_stops_area FOREIGN KEY (area_id) REFERENCES study_areas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE trail_stop_exercises (
  trail_stop_id char(36) NOT NULL,
  exercise_id char(36) NOT NULL,
  PRIMARY KEY (trail_stop_id,exercise_id),
  KEY fk_tse_exercise (exercise_id),
  CONSTRAINT fk_tse_exercise FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE,
  CONSTRAINT fk_tse_stop FOREIGN KEY (trail_stop_id) REFERENCES trail_stops (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_avatar_config (
  user_id char(36) NOT NULL,
  config_json longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(config_json)),
  updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (user_id),
  CONSTRAINT fk_uac_user FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_avatar_items (
  user_id char(36) NOT NULL,
  item_id char(36) NOT NULL,
  unlocked_at datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (user_id,item_id),
  KEY fk_uai_item (item_id),
  CONSTRAINT fk_uai_item FOREIGN KEY (item_id) REFERENCES avatar_items (id) ON DELETE CASCADE,
  CONSTRAINT fk_uai_user FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_trail_progress (
  user_id char(36) NOT NULL,
  trail_stop_id char(36) NOT NULL,
  completed_at datetime NOT NULL DEFAULT current_timestamp(),
  xp_earned int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id,trail_stop_id),
  KEY fk_progress_stop (trail_stop_id),
  CONSTRAINT fk_progress_stop FOREIGN KEY (trail_stop_id) REFERENCES trail_stops (id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES app_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────
-- 2. DADOS (Sem acentos para evitar erro de codificação no import)
-- ─────────────────────────────────────────────────────────────────

INSERT INTO study_areas (id, label, color, icon) VALUES
('backend', 'Backend', '#10b981', '⚙️'),
('devops', 'DevOps', '#e879f9', '🔧'),
('frontend', 'Frontend', '#06b6d4', '🎨'),
('fullstack', 'Fullstack', '#8b5cf6', '⚡'),
('mobile', 'Mobile', '#f59e0b', '📱'),
('security', 'Security', '#ef4444', '🔐');

INSERT INTO exercises (id, area_id, question, answer, type, difficulty) VALUES
('f1','frontend','Qual tag HTML define o maior titulo da pagina?','A tag <h1> define o titulo de maior hierarquia na pagina.','multiple_choice','easy'),
('f2','frontend','O que e o box model no CSS?','O box model define como os elementos sao renderizados: content, padding, border e margin.','multiple_choice','easy'),
('f3','frontend','Para que serve o display flex no CSS?','Para criar layouts flexiveis em uma dimensao (linha ou coluna), alinhando elementos facilmente.','multiple_choice','medium'),
('f4','frontend','Qual hook do React e usado para efeitos colaterais?','useEffect - executa codigo apos a renderizacao e quando dependencias mudam.','multiple_choice','medium'),
('b1','backend','Qual metodo HTTP e usado para criar um recurso?','POST - envia dados para criar um novo recurso no servidor.','multiple_choice','easy'),
('b2','backend','Qual o status HTTP para recurso nao encontrado?','404 Not Found - indica que o recurso solicitado nao existe no servidor.','multiple_choice','easy'),
('b3','backend','O que e JWT?','JSON Web Token - padrao para transmitir informacoes de autenticacao de forma segura entre partes.','multiple_choice','medium'),
('b4','backend','O que e uma API RESTful?','Uma API que segue os principios REST: stateless, recursos identificados por URIs e operacoes via metodos HTTP.','multiple_choice','medium'),
('m1','mobile','Qual componente substitui div no React Native?','View - o equivalente da div do HTML no React Native.','multiple_choice','easy'),
('m2','mobile','Qual componente e usado para listas performaticas no RN?','FlatList - renderiza listas longas de forma eficiente com virtualizacao.','multiple_choice','easy'),
('m3','mobile','Para que serve o AsyncStorage?','Para persistir dados simples de forma assincrona no dispositivo, como chave-valor.','multiple_choice','medium'),
('m4','mobile','O que e Expo?','Um framework e plataforma para React Native que simplifica o desenvolvimento e build de apps.','multiple_choice','easy'),
('d1','backend','O que e a 1FN (Primeira Forma Normal)?','Garante que cada coluna contenha valores atomicos (indivisiveis), sem listas ou grupos repetidos.','multiple_choice','medium'),
('d2','backend','O que e uma chave estrangeira (FK)?','Uma coluna que referencia a chave primaria de outra tabela, garantindo integridade referencial.','multiple_choice','easy'),
('d3','backend','Qual comando SQL retorna todos os registros de uma tabela?','SELECT * FROM nome_tabela; - retorna todas as colunas e linhas da tabela.','multiple_choice','easy'),
('d4','backend','O que e um indice no banco de dados?','Uma estrutura que acelera buscas em colunas especificas, ao custo de espaco em disco.','multiple_choice','medium'),
('g1','devops','Qual comando cria um novo repositorio Git?','git init - inicializa um repositorio Git vazio na pasta atual.','multiple_choice','easy'),
('g2','devops','Qual comando envia commits para o repositorio remoto?','git push - envia os commits locais para o repositorio remoto (ex: GitHub).','multiple_choice','easy'),
('g3','devops','O que faz o git merge?','Combina o historico de dois branches diferentes em um so.','multiple_choice','medium'),
('g4','devops','O que e um pull request?','Um pedido para integrar mudancas de um branch em outro, geralmente revisado antes do merge.','multiple_choice','medium'),
('l1','fullstack','O que e uma variavel?','Um espaco na memoria com um nome que armazena um valor que pode ser alterado.','multiple_choice','easy'),
('l2','fullstack','Qual a diferenca entre == e === no JavaScript?','== compara valores com coercao de tipo; === compara valor e tipo sem coercao.','multiple_choice','easy'),
('l3','fullstack','O que e uma funcao recursiva?','Uma funcao que chama a si mesma ate atingir um caso base.','multiple_choice','medium'),
('l4','fullstack','O que e Big O Notation?','Uma forma de descrever a complexidade de um algoritmo em termos de tempo ou espaco no pior caso.','multiple_choice','hard'),
('l5','fullstack','O que e um array?','Uma estrutura de dados que armazena elementos em posicoes indexadas sequencialmente.','multiple_choice','easy'),
('l6','fullstack','Qual a diferenca entre stack e heap na memoria?','Stack armazena variaveis locais e chamadas de funcao (LIFO); Heap armazena objetos alocados dinamicamente.','multiple_choice','hard'),
('a1','backend','O que e um endpoint?','Uma URL especifica de uma API que aceita requisicoes para executar uma operacao.','multiple_choice','easy'),
('a2','backend','O que e paginacao em APIs?','Tecnica para dividir grandes conjuntos de dados em paginas menores, reduzindo carga no servidor.','multiple_choice','medium'),
('a3','backend','O que e CORS?','Cross-Origin Resource Sharing - politica que controla quais origens podem acessar recursos de uma API.','multiple_choice','medium');

INSERT INTO trail_stops (id, area_id, stop_order, title, subtitle, icon, color, level, xp_reward) VALUES
('fe1','frontend',1,'HTML & CSS','Estrutura e estilo','</>','#06b6d4','basic',40),
('fe2','frontend',2,'Layouts Modernos','Flexbox e Grid','[]','#0891b2','basic',50),
('fe3','frontend',3,'JavaScript Core','Logica e funcoes','{}','#0e7490','basic',60),
('fe4','frontend',4,'React Fundamentos','Componentes e hooks','Re','#f59e0b','intermediate',70),
('fe5','frontend',5,'Estado & Contexto','useState e Context','>>','#d97706','intermediate',80),
('fe6','frontend',6,'APIs no Frontend','Fetch e debounce','[ ]','#b45309','intermediate',90),
('fe7','frontend',7,'Performance','Memo e otimizacao','Z!','#8b5cf6','advanced',110),
('fe8','frontend',8,'Arquitetura React','Patterns avancados','[]','#7c3aed','advanced',130),
('be1','backend',1,'HTTP Basico','Metodos e status','#','#10b981','basic',40),
('be2','backend',2,'Express & Rotas','Servidor e endpoints','@','#059669','basic',50),
('be3','backend',3,'CRUD Completo','Create, Read, Update','DB','#047857','basic',60),
('be4','backend',4,'Banco de Dados','SQL e modelagem','{}','#f59e0b','intermediate',80),
('be5','backend',5,'Autenticacao','JWT e middlewares','**','#d97706','intermediate',90),
('be6','backend',6,'APIs Avancadas','Paginacao e cache','>>','#b45309','intermediate',100),
('be7','backend',7,'Performance SQL','Indices e queries','Z!','#8b5cf6','advanced',120),
('be8','backend',8,'Arquitetura','Clean e microsservicos','[]','#7c3aed','advanced',140),
('mo1','mobile',1,'RN Fundamentos','Views e estilo','[]','#f59e0b','basic',40),
('mo2','mobile',2,'Listas & Scroll','FlatList e scroll','--','#d97706','basic',50),
('mo3','mobile',3,'Navegacao','Rotas e Stack','>>','#b45309','basic',60),
('mo4','mobile',4,'Estado & Hooks','useState e Context','{}','#8b5cf6','intermediate',75),
('mo5','mobile',5,'Persistencia','AsyncStorage e SQLite','SQ','#7c3aed','intermediate',85),
('mo6','mobile',6,'APIs Mobile','Fetch e offline','>>','#6d28d9','intermediate',95),
('mo7','mobile',7,'Animacoes','Reanimated 3','**','#ef4444','advanced',115),
('mo8','mobile',8,'Performance','Otimizacao nativa','Z!','#dc2626','advanced',135),
('fs1','fullstack',1,'Frontend Base','HTML, CSS e JS','</>','#8b5cf6','basic',40),
('fs2','fullstack',2,'Backend Base','Node e Express','#','#7c3aed','basic',50),
('fs3','fullstack',3,'Banco de Dados','SQL fundamental','DB','#6d28d9','basic',60),
('fs4','fullstack',4,'React + API','Frontend e backend','Re','#06b6d4','intermediate',75),
('fs5','fullstack',5,'Autenticacao','JWT end-to-end','**','#0891b2','intermediate',90),
('fs6','fullstack',6,'Deploy & CI/CD','Ambiente e pipeline','>>','#0e7490','intermediate',100),
('fs7','fullstack',7,'Escalabilidade','Cache e performance','Z!','#10b981','advanced',120),
('fs8','fullstack',8,'Arquitetura','Design patterns','[]','#059669','advanced',150),
('do1','devops',1,'Git Basico','Commits e historico','>>','#e879f9','basic',40),
('do2','devops',2,'Branches','Merge e conflitos','<>','#d946ef','basic',55),
('do3','devops',3,'Logica Dev','Algoritmos base','{}','#c026d3','basic',60),
('do4','devops',4,'APIs & REST','Integracao de servicos','>>','#f59e0b','intermediate',75),
('do5','devops',5,'Banco de Dados','SQL e queries','DB','#d97706','intermediate',85),
('do6','devops',6,'Seguranca','Auth e middlewares','**','#b45309','intermediate',100),
('do7','devops',7,'Performance','Cache e otimizacao','Z!','#8b5cf6','advanced',120),
('do8','devops',8,'Infraestrutura','Deploy e pipelines','>>','#7c3aed','advanced',145);

INSERT INTO trail_stop_exercises (trail_stop_id, exercise_id) VALUES
('be1','b1'),('be1','l1'),('be1','l2'),('be2','b2'),('be2','l3'),('be2','l4'),('be3','b1'),('be3','b2'),('be3','l5'),('be4','d1'),('be4','d2'),('be4','d3'),('be5','b3'),('be5','d1'),('be5','l6'),('be6','a1'),('be6','b4'),('be6','d2'),('be7','b3'),('be7','d3'),('be7','d4'),('be8','a3'),('be8','b4'),('be8','d4'),('do1','g1'),('do1','g2'),('do1','l1'),('do2','g3'),('do2','g4'),('do2','l2'),('do3','l3'),('do3','l4'),('do3','l5'),('do4','a1'),('do4','a2'),('do4','b1'),('do5','d1'),('do5','d2'),('do5','l6'),('do6','b3'),('do6','b4'),('do6','d3'),('do7','a3'),('do7','d4'),('do7','l6'),('do8','a2'),('do8','b4'),('do8','d4'),('fe1','f1'),('fe1','l1'),('fe1','l2'),('fe2','f2'),('fe2','f3'),('fe2','l3'),('fe3','l4'),('fe3','l5'),('fe3','l6'),('fe4','f1'),('fe4','f2'),('fe4','f3'),('fe5','f4'),('fe5','l1'),('fe5','l2'),('fe6','a1'),('fe6','a2'),('fe6','a3'),('fe7','a3'),('fe7','f4'),('fe7','l6'),('fe8','a2'),('fe8','f3'),('fe8','f4'),('fs1','f1'),('fs1','l1'),('fs1','l2'),('fs2','b1'),('fs2','b2'),('fs2','l3'),('fs3','d1'),('fs3','d2'),('fs3','l4'),('fs4','a1'),('fs4','b3'),('fs4','f2'),('fs5','b3'),('fs5','f3'),('fs5','l5'),('fs6','a2'),('fs6','b4'),('fs6','d3'),('fs7','a3'),('fs7','b4'),('fs7','d4'),('fs8','a3'),('fs8','d4'),('fs8','l6'),('mo1','l1'),('mo1','l2'),('mo1','m1'),('mo2','l3'),('mo2','l4'),('mo2','m2'),('mo3','f1'),('mo3','l5'),('mo3','m1'),('mo4','f2'),('mo4','f3'),('mo4','m2'),('mo5','a1'),('mo5','l6'),('mo5','m2'),('mo6','a1'),('mo6','a2'),('mo6','m3'),('mo7','a3'),('mo7','m3'),('mo7','m4'),('mo8','l5'),('mo8','l6'),('mo8','m4');

COMMIT;
