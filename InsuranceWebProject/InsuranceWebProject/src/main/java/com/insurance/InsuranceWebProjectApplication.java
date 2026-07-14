package com.insurance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class InsuranceWebProjectApplication {

	public static void main(String[] args) {
		SpringApplication.run(InsuranceWebProjectApplication.class, args);
	}

}
