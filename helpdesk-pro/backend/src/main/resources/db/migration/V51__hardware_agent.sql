INSERT INTO agent_capability_definitions (key, label, description)
VALUES (
    'HARDWARE_REQUEST',
    'Hardware Request',
    'Flags hardware-related tickets for manual follow-up to arrange a replacement or repair.'
);

INSERT INTO agent_definitions (name, description, trigger_category, keywords, capability, auto_close, active)
VALUES (
    'Hardware Capability Agent',
    'Flags hardware-issue tickets for manual follow-up.',
    'Hardware',
    '["hardware", "keyboard", "mouse", "screen"]',
    'HARDWARE_REQUEST',
    false,
    true
);
