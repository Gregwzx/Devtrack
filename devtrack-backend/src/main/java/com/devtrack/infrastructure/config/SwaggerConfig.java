package com.devtrack.infrastructure.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// configura o Swagger UI em /swagger-ui.html
// inclui o botão "Authorize" pra testar endpoints protegidos por JWT
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("DevTrack API")
                        .description("API REST do DevTrack — plataforma de rastreamento de aprendizados para devs. " +
                                "Autentique-se com POST /api/v1/auth/login e use o token no botão 'Authorize'.")
                        .version("v1.0")
                        .contact(new Contact()
                                .name("Time DevTrack")
                                .url("https://github.com/Gregwzx/Devtrack")))
                .components(new Components()
                        // registra o esquema bearerAuth — aparece o cadeado nos endpoints no Swagger
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Cole o access token recebido no login")));
    }
}
