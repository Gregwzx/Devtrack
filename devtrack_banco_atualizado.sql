-- Banco de Dados atualizado DevTrack (MySQL/XAMPP)
-- Contém a estrutura atualizada das tabelas e DADOS FICTÍCIOS para preencher o Ranking

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "-03:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- Cria o banco se não existir
CREATE DATABASE IF NOT EXISTS `devtrack` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `devtrack`;

-- --------------------------------------------------------

--
-- Estrutura para tabela `app_users`
--
DROP TABLE IF EXISTS `app_users`;
CREATE TABLE `app_users` (
  `id` varchar(255) NOT NULL,
  `banner_color` varchar(255) DEFAULT '#1a1040',
  `bio` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `email` varchar(255) NOT NULL,
  `lives` int DEFAULT '5',
  `lives_last_refill` datetime(6) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `study_area` varchar(50) DEFAULT 'fullstack',
  `updated_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `streaks`
--
DROP TABLE IF EXISTS `streaks`;
CREATE TABLE `streaks` (
  `id` varchar(255) NOT NULL,
  `count` int NOT NULL DEFAULT '0',
  `last_date` date DEFAULT NULL,
  `user_id` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_user_id_streak` (`user_id`),
  CONSTRAINT `FK_streaks_user` FOREIGN KEY (`user_id`) REFERENCES `app_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `learnings`
--
DROP TABLE IF EXISTS `learnings`;
CREATE TABLE `learnings` (
  `id` varchar(255) NOT NULL,
  `area` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `stacks_json` varchar(255) DEFAULT NULL,
  `text` text NOT NULL,
  `type` varchar(255) DEFAULT NULL,
  `user_id` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_learnings_user` FOREIGN KEY (`user_id`) REFERENCES `app_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- DADOS FICTÍCIOS PARA POVOAR O RANKING E TESTAR (mock data)
-- A senha de todos é a mesma gerada pelo BCrypt: "senha123"
--

INSERT INTO `app_users` (`id`, `name`, `email`, `password_hash`, `study_area`, `banner_color`, `bio`, `created_at`) VALUES
('user_1_ana', 'Ana Silva', 'ana@teste.com', '$2a$10$7ZqC6N14PjH0iL6G.rZfOe4T4Yp3B.89p61rO7U6uT/X6hTfLp3h.', 'frontend', '#06b6d4', 'Amante de CSS e React.', '2023-01-10 10:00:00.000000'),
('user_2_carlos', 'Carlos Dev', 'carlos@teste.com', '$2a$10$7ZqC6N14PjH0iL6G.rZfOe4T4Yp3B.89p61rO7U6uT/X6hTfLp3h.', 'backend', '#10b981', 'Java + Spring Boot <3', '2023-02-15 11:30:00.000000'),
('user_3_bia', 'Beatriz Code', 'beatriz@teste.com', '$2a$10$7ZqC6N14PjH0iL6G.rZfOe4T4Yp3B.89p61rO7U6uT/X6hTfLp3h.', 'mobile', '#f59e0b', 'Criando apps incríveis.', '2023-03-20 09:15:00.000000'),
('user_4_rafa', 'Rafael Tech', 'rafael@teste.com', '$2a$10$7ZqC6N14PjH0iL6G.rZfOe4T4Yp3B.89p61rO7U6uT/X6hTfLp3h.', 'devops', '#8b5cf6', 'Docker e Kubernetes o dia todo.', '2023-04-05 14:45:00.000000'),
('user_5_ju', 'Juliana UX', 'juliana@teste.com', '$2a$10$7ZqC6N14PjH0iL6G.rZfOe4T4Yp3B.89p61rO7U6uT/X6hTfLp3h.', 'frontend', '#e879f9', 'Tornando a web mais bonita.', '2023-05-12 16:20:00.000000'),
('user_6_pedro', 'Pedro Sênior', 'pedro@teste.com', '$2a$10$7ZqC6N14PjH0iL6G.rZfOe4T4Yp3B.89p61rO7U6uT/X6hTfLp3h.', 'fullstack', '#ef4444', 'Resolvendo bugs desde 1999.', '2023-06-01 08:00:00.000000'),
('user_7_lucas', 'Lucas DevOps', 'lucas@teste.com', '$2a$10$7ZqC6N14PjH0iL6G.rZfOe4T4Yp3B.89p61rO7U6uT/X6hTfLp3h.', 'devops', '#3b82f6', 'Automação é vida.', '2023-07-22 13:10:00.000000');


INSERT INTO `streaks` (`id`, `user_id`, `count`, `last_date`) VALUES
('str_1', 'user_1_ana', 45, CURRENT_DATE()),
('str_2', 'user_2_carlos', 32, CURRENT_DATE()),
('str_3', 'user_3_bia', 28, CURRENT_DATE()),
('str_4', 'user_4_rafa', 21, CURRENT_DATE()),
('str_5', 'user_5_ju', 18, CURRENT_DATE()),
('str_6', 'user_6_pedro', 50, CURRENT_DATE()),
('str_7', 'user_7_lucas', 5, CURRENT_DATE());


-- Inserindo vários aprendizados para gerar XP (10 XP por aprendizado)
-- Ana (450 XP = 45 learnings)
INSERT INTO `learnings` (`id`, `user_id`, `area`, `type`, `stacks_json`, `text`, `created_at`)
SELECT CONCAT('lrn_ana_', seq), 'user_1_ana', 'frontend', 'concept', '["React", "CSS"]', 'Estudando conceitos avançados de React', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL seq DAY)
FROM (SELECT 1 AS seq UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30 UNION ALL SELECT 31 UNION ALL SELECT 32 UNION ALL SELECT 33 UNION ALL SELECT 34 UNION ALL SELECT 35 UNION ALL SELECT 36 UNION ALL SELECT 37 UNION ALL SELECT 38 UNION ALL SELECT 39 UNION ALL SELECT 40 UNION ALL SELECT 41 UNION ALL SELECT 42 UNION ALL SELECT 43 UNION ALL SELECT 44 UNION ALL SELECT 45) AS seqs;

-- Carlos (320 XP = 32 learnings)
INSERT INTO `learnings` (`id`, `user_id`, `area`, `type`, `stacks_json`, `text`, `created_at`)
SELECT CONCAT('lrn_carlos_', seq), 'user_2_carlos', 'backend', 'bug', '["Java", "Spring Boot"]', 'Resolvendo bugs no Spring', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL seq DAY)
FROM (SELECT 1 AS seq UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30 UNION ALL SELECT 31 UNION ALL SELECT 32) AS seqs;

-- Bia (280 XP = 28 learnings)
INSERT INTO `learnings` (`id`, `user_id`, `area`, `type`, `stacks_json`, `text`, `created_at`)
SELECT CONCAT('lrn_bia_', seq), 'user_3_bia', 'mobile', 'project', '["React Native", "Expo"]', 'Criando telas no Expo', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL seq DAY)
FROM (SELECT 1 AS seq UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28) AS seqs;

-- Rafa (210 XP = 21 learnings)
INSERT INTO `learnings` (`id`, `user_id`, `area`, `type`, `stacks_json`, `text`, `created_at`)
SELECT CONCAT('lrn_rafa_', seq), 'user_4_rafa', 'devops', 'reading', '["Docker", "AWS"]', 'Lendo docs da AWS', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL seq DAY)
FROM (SELECT 1 AS seq UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20 UNION ALL SELECT 21) AS seqs;

-- Ju (180 XP = 18 learnings)
INSERT INTO `learnings` (`id`, `user_id`, `area`, `type`, `stacks_json`, `text`, `created_at`)
SELECT CONCAT('lrn_ju_', seq), 'user_5_ju', 'frontend', 'tip', '["Figma", "CSS"]', 'Dicas de UI/UX', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL seq DAY)
FROM (SELECT 1 AS seq UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18) AS seqs;

-- Pedro (800 XP = 80 learnings) -- Lendário
INSERT INTO `learnings` (`id`, `user_id`, `area`, `type`, `stacks_json`, `text`, `created_at`)
SELECT CONCAT('lrn_pedro_', seq), 'user_6_pedro', 'fullstack', 'review', '["Node.js", "React"]', 'Revisão de arquitetura', DATE_SUB(CURRENT_TIMESTAMP, INTERVAL seq DAY)
FROM (
  SELECT a.seq + b.seq * 10 AS seq
  FROM (SELECT 0 AS seq UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a
  JOIN (SELECT 0 AS seq UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7) b
  WHERE (a.seq + b.seq * 10) > 0 AND (a.seq + b.seq * 10) <= 80
) AS seqs;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
