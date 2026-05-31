package com.clinicsaas.exceptions;

public class TenantProvisioningException extends RuntimeException {
    public TenantProvisioningException(String message, Throwable cause) {
        super(message, cause);
    }
}
