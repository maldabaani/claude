package com.clinicsaas.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
public class NotificationService {

    private final JavaMailSender mailSender;
    private final boolean mailEnabled;
    private final String fromEmail;

    public NotificationService(
            JavaMailSender mailSender,
            @Value("${app.mail.enabled:false}") boolean mailEnabled,
            @Value("${app.mail.from}") String fromEmail) {
        this.mailSender = mailSender;
        this.mailEnabled = mailEnabled;
        this.fromEmail = fromEmail;
    }

    public void sendAppointmentConfirmation(String toEmail, String patientName,
                                             LocalDateTime appointmentTime, String doctorName) {
        if (!mailEnabled || !StringUtils.hasText(toEmail)) {
            log.debug("Mail disabled or no recipient — skipping appointment confirmation for {}", patientName);
            return;
        }
        log.debug("Sending appointment confirmation to {}", toEmail);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Appointment Confirmed");
        message.setText(String.format(
                "Dear %s,%n%nYour appointment has been confirmed.%n" +
                "Date/Time: %s%n" +
                "Doctor: %s%n%n" +
                "Please arrive 10 minutes before your scheduled time.%n%n" +
                "Thank you.",
                patientName,
                appointmentTime.format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm")),
                doctorName));
        mailSender.send(message);
        log.debug("Sent appointment confirmation to {}", toEmail);
    }

    public void sendLabResultReady(String toEmail, String patientName, String testName) {
        if (!mailEnabled || !StringUtils.hasText(toEmail)) {
            log.debug("Mail disabled or no recipient — skipping lab result notification for {}", patientName);
            return;
        }
        log.debug("Sending lab result notification to {}", toEmail);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Your Lab Results Are Ready");
        message.setText(String.format(
                "Dear %s,%n%nYour lab results for '%s' are now ready.%n" +
                "Please log in to the patient portal or contact us to review your results.%n%n" +
                "Thank you.",
                patientName, testName));
        mailSender.send(message);
        log.debug("Sent lab result notification to {}", toEmail);
    }

    public void sendPreAuthUpdate(String toEmail, String patientName,
                                   String preauthNumber, String status) {
        if (!mailEnabled || !StringUtils.hasText(toEmail)) {
            log.debug("Mail disabled or no recipient — skipping pre-auth update for {}", patientName);
            return;
        }
        log.debug("Sending pre-authorization update to {}", toEmail);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Pre-Authorization Update");
        message.setText(String.format(
                "Dear %s,%n%nYour pre-authorization request %s has been updated.%n" +
                "Status: %s%n%n" +
                "Please contact us if you have any questions.%n%n" +
                "Thank you.",
                patientName, preauthNumber, status));
        mailSender.send(message);
        log.debug("Sent pre-auth update to {}", toEmail);
    }
}
