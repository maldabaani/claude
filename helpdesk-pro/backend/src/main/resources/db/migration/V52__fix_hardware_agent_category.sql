-- The customer "Hardware Issue" template stores category 'Hardware', but the
-- agent-definition admin UI only offers technical/billing/account/feature_request/other,
-- so a manually-created HARDWARE_REQUEST agent ends up with a non-matching
-- trigger_category and the engine never fires. Normalize any existing
-- HARDWARE_REQUEST agent to trigger on 'Hardware' and be active.
UPDATE agent_definitions
SET trigger_category = 'Hardware',
    active = true,
    updated_at = NOW()
WHERE capability = 'HARDWARE_REQUEST';

-- If no HARDWARE_REQUEST agent exists at all, create one.
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
