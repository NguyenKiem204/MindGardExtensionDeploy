package com.kiemnv.MindGardAPI;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MindGardApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(MindGardApiApplication.class, args);
	}

}
