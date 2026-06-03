package com.clinicsaas.logging;

import ch.qos.logback.classic.pattern.MessageConverter;
import ch.qos.logback.classic.spi.ILoggingEvent;

import java.util.regex.Pattern;

public class MaskingConverter extends MessageConverter {

    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}");

    private static final Pattern PHONE_PATTERN =
        Pattern.compile("\\b(\\+?\\d[\\d\\s\\-().]{6,}\\d)\\b");

    @Override
    public String convert(ILoggingEvent event) {
        String msg = super.convert(event);
        msg = EMAIL_PATTERN.matcher(msg).replaceAll("[email]");
        msg = PHONE_PATTERN.matcher(msg).replaceAll("[phone]");
        return msg;
    }
}
