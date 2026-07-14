package com.insurance;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import static org.junit.jupiter.api.Assertions.*;

class InsuranceWebProjectApplicationTests {

	@Test
	void applicationClassHasSpringBootAnnotation() {
		assertTrue(
			InsuranceWebProjectApplication.class.isAnnotationPresent(SpringBootApplication.class),
			"Main class should be annotated with @SpringBootApplication"
		);
	}

	@Test
	void mainMethodExists() throws NoSuchMethodException {
		assertNotNull(
			InsuranceWebProjectApplication.class.getMethod("main", String[].class),
			"Main class should have a public static main method"
		);
	}

}
