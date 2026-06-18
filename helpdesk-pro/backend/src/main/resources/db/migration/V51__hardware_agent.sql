INSERT INTO agent_capability_definitions (key, label, description)
SELECT 'HARDWARE_REQUEST',
       'Hardware Request',
       'Flags hardware-related tickets for manual follow-up to arrange a replacement or repair.'
WHERE NOT EXISTS (
    SELECT 1 FROM agent_capability_definitions WHERE key = 'HARDWARE_REQUEST'
);

INSERT INTO agent_definitions (name, description, trigger_category, keywords, capability, auto_close, active)
SELECT 'Hardware Capability Agent',
       'Flags hardware-issue tickets for manual follow-up.',
       'Hardware',
       '["hardware", "keyboard", "mouse", "screen"]',
       'HARDWARE_REQUEST',
       false,
       true
WHERE NOT EXISTS (
    SELECT 1 FROM agent_definitions WHERE capability = 'HARDWARE_REQUEST'
);
