package com.payshield;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class PayshieldApplication {
    public static void main(String[] args) {
        SpringApplication.run(PayshieldApplication.class, args);
    }
}
