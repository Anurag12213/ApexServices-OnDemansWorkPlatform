package com.apexservices;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ApexServicesBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(ApexServicesBackendApplication.class, args);
	}

}
