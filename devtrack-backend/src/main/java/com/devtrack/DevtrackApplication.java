package com.devtrack;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// ponto de entrada da aplicação — aqui o Spring sobe tudo
// @SpringBootApplication = auto-config + component scan + configurações automáticas
@SpringBootApplication
public class DevtrackApplication {

    // inicia o servidor Tomcat embutido na porta 8080
    public static void main(String[] args) {
        SpringApplication.run(DevtrackApplication.class, args);
    }
}
