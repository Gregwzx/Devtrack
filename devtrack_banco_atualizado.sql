-- ============================================================
-- Banco de Dados DevTrack (MySQL/XAMPP)
-- Estrutura com tipos de dados corretos e dados fictícios
-- para testes do ranking.
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "-03:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- Cria o banco se não existir
CREATE DATABASE IF NOT EXISTS `devtrack`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `devtrack`;

-- ============================================================
-- Remove tabelas na ordem correta (dependentes primeiro)
-- ============================================================
DROP TABLE IF EXISTS `learnings`;
DROP TABLE IF EXISTS `streaks`;
DROP TABLE IF EXISTS `app_users`;

-- ============================================================
-- Tabela: app_users
-- Armazena os dados de todos os usuários cadastrados.
-- ============================================================
CREATE TABLE `app_users` (
  `id`                BIGINT           NOT NULL AUTO_INCREMENT,
  `name`              VARCHAR(100)     NOT NULL,
  `email`             VARCHAR(150)     NOT NULL,
  `password_hash`     VARCHAR(255)     NOT NULL,
  `photo_url`         VARCHAR(255)         NULL DEFAULT NULL,
  `bio`               TEXT                 NULL DEFAULT NULL,
  `banner_color`      VARCHAR(20)          NULL DEFAULT '#1a1040',
  `study_area`        VARCHAR(50)          NULL DEFAULT 'fullstack',
  `lives`             TINYINT UNSIGNED NOT NULL DEFAULT 5,
  `lives_last_refill` DATETIME(6)          NULL DEFAULT NULL,
  `created_at`        DATETIME(6)      NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at`        DATETIME(6)      NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                                ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_app_users_email` (`email`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabela: streaks
-- Controla a sequência diária de estudo de cada usuário (1:1).
-- ============================================================
CREATE TABLE `streaks` (
  `id`        BIGINT   NOT NULL AUTO_INCREMENT,
  `user_id`   BIGINT   NOT NULL,
  `count`     SMALLINT NOT NULL DEFAULT 0,
  `last_date` DATE         NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_streaks_user_id` (`user_id`),
  CONSTRAINT `FK_streaks_user`
    FOREIGN KEY (`user_id`) REFERENCES `app_users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Tabela: learnings
-- Registros individuais de aprendizado de cada usuário (N:1).
-- ============================================================
CREATE TABLE `learnings` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT,
  `user_id`     BIGINT      NOT NULL,
  `text`        TEXT        NOT NULL,
  `area`        VARCHAR(50)     NULL DEFAULT NULL,
  `type`        VARCHAR(50)     NULL DEFAULT NULL,
  `stacks_json` TEXT            NULL DEFAULT NULL,
  `created_at`  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  CONSTRAINT `FK_learnings_user`
    FOREIGN KEY (`user_id`) REFERENCES `app_users` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DADOS FICTÍCIOS para popular o ranking (mock data)
-- Senha de todos: "senha123" (hash BCrypt)
-- ============================================================

INSERT INTO `app_users` (`name`, `email`, `password_hash`, `study_area`, `banner_color`, `bio`, `created_at`) VALUES
('Ana Silva',    'ana@teste.com',     '$2a$10$7ZqC6N14PjH0iL6G.rZfOe4T4Yp3B.89p61rO7U6uT/X6hTfLp3h.', 'frontend',  '#06b6d4', 'Amante de CSS e React.',         '2023-01-10 10:00:00.000000'),
('Carlos Dev',   'carlos@teste.com',  '$2a$10$7ZqC6N14PjH0iL6G.rZfOe4T4Yp3B.89p61rO7U6uT/X6hTfLp3h.', 'backend',   '#10b981', 'Java + Spring Boot <3',           '2023-02-15 11:30:00.000000'),
('Beatriz Code', 'beatriz@teste.com', '$2a$10$7ZqC6N14PjH0iL6G.rZfOe4T4Yp3B.89p61rO7U6uT/X6hTfLp3h.', 'mobile',    '#f59e0b', 'Criando apps incriveis.',         '2023-03-20 09:15:00.000000'),
('Rafael Tech',  'rafael@teste.com',  '$2a$10$7ZqC6N14PjH0iL6G.rZfOe4T4Yp3B.89p61rO7U6uT/X6hTfLp3h.', 'devops',    '#8b5cf6', 'Docker e Kubernetes o dia todo.', '2023-04-05 14:45:00.000000'),
('Juliana UX',   'juliana@teste.com', '$2a$10$7ZqC6N14PjH0iL6G.rZfOe4T4Yp3B.89p61rO7U6uT/X6hTfLp3h.', 'frontend',  '#e879f9', 'Tornando a web mais bonita.',     '2023-05-12 16:20:00.000000'),
('Pedro Senior', 'pedro@teste.com',   '$2a$10$7ZqC6N14PjH0iL6G.rZfOe4T4Yp3B.89p61rO7U6uT/X6hTfLp3h.', 'fullstack', '#ef4444', 'Resolvendo bugs desde 1999.',     '2023-06-01 08:00:00.000000'),
('Lucas DevOps', 'lucas@teste.com',   '$2a$10$7ZqC6N14PjH0iL6G.rZfOe4T4Yp3B.89p61rO7U6uT/X6hTfLp3h.', 'devops',    '#3b82f6', 'Automacao e vida.',               '2023-07-22 13:10:00.000000');

-- Streaks dos usuários (IDs 1–7 gerados pelo AUTO_INCREMENT)
INSERT INTO `streaks` (`user_id`, `count`, `last_date`) VALUES
(1, 45, CURRENT_DATE()),
(2, 32, CURRENT_DATE()),
(3, 28, CURRENT_DATE()),
(4, 21, CURRENT_DATE()),
(5, 18, CURRENT_DATE()),
(6, 50, CURRENT_DATE()),
(7,  5, CURRENT_DATE());

-- Aprendizados — Ana (45 registros = 450 XP)
INSERT INTO `learnings` (`user_id`, `area`, `type`, `stacks_json`, `text`, `created_at`)
SELECT 1, 'frontend', 'concept', 'React,CSS',
       CONCAT('Estudando conceitos avancados de React - dia ', seq),
       DATE_SUB(CURRENT_TIMESTAMP, INTERVAL seq DAY)
FROM (
  SELECT 1 AS seq  UNION ALL SELECT 2  UNION ALL SELECT 3  UNION ALL SELECT 4  UNION ALL SELECT 5
  UNION ALL SELECT 6  UNION ALL SELECT 7  UNION ALL SELECT 8  UNION ALL SELECT 9  UNION ALL SELECT 10
  UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
  UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20
  UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25
  UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30
  UNION ALL SELECT 31 UNION ALL SELECT 32 UNION ALL SELECT 33 UNION ALL SELECT 34 UNION ALL SELECT 35
  UNION ALL SELECT 36 UNION ALL SELECT 37 UNION ALL SELECT 38 UNION ALL SELECT 39 UNION ALL SELECT 40
  UNION ALL SELECT 41 UNION ALL SELECT 42 UNION ALL SELECT 43 UNION ALL SELECT 44 UNION ALL SELECT 45
) AS seqs;

-- Aprendizados — Carlos (32 registros = 320 XP)
INSERT INTO `learnings` (`user_id`, `area`, `type`, `stacks_json`, `text`, `created_at`)
SELECT 2, 'backend', 'bug', 'Java,Spring Boot',
       CONCAT('Resolvendo bugs no Spring - dia ', seq),
       DATE_SUB(CURRENT_TIMESTAMP, INTERVAL seq DAY)
FROM (
  SELECT 1 AS seq  UNION ALL SELECT 2  UNION ALL SELECT 3  UNION ALL SELECT 4  UNION ALL SELECT 5
  UNION ALL SELECT 6  UNION ALL SELECT 7  UNION ALL SELECT 8  UNION ALL SELECT 9  UNION ALL SELECT 10
  UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
  UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20
  UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25
  UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30
  UNION ALL SELECT 31 UNION ALL SELECT 32
) AS seqs;

-- Aprendizados — Beatriz (28 registros = 280 XP)
INSERT INTO `learnings` (`user_id`, `area`, `type`, `stacks_json`, `text`, `created_at`)
SELECT 3, 'mobile', 'project', 'React Native,Expo',
       CONCAT('Criando telas no Expo - dia ', seq),
       DATE_SUB(CURRENT_TIMESTAMP, INTERVAL seq DAY)
FROM (
  SELECT 1 AS seq  UNION ALL SELECT 2  UNION ALL SELECT 3  UNION ALL SELECT 4  UNION ALL SELECT 5
  UNION ALL SELECT 6  UNION ALL SELECT 7  UNION ALL SELECT 8  UNION ALL SELECT 9  UNION ALL SELECT 10
  UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
  UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20
  UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25
  UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28
) AS seqs;

-- Aprendizados — Pedro (80 registros = 800 XP) — Lendario
INSERT INTO `learnings` (`user_id`, `area`, `type`, `stacks_json`, `text`, `created_at`)
SELECT 6, 'fullstack', 'review', 'Node.js,React',
       CONCAT('Revisao de arquitetura fullstack - dia ', seq),
       DATE_SUB(CURRENT_TIMESTAMP, INTERVAL seq DAY)
FROM (
  SELECT (a.n + b.n * 10) AS seq
  FROM (SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
        UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 0) a
  JOIN  (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
         UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7) b
  WHERE (a.n + b.n * 10) BETWEEN 1 AND 80
) AS seqs;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
