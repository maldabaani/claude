CREATE TABLE kb_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    icon        VARCHAR(50) DEFAULT 'pi-folder',
    sort_order  INT DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at  TIMESTAMP WITH TIME ZONE
);

CREATE TABLE kb_articles (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id   UUID REFERENCES kb_categories(id),
    title         VARCHAR(300) NOT NULL,
    slug          VARCHAR(300) NOT NULL UNIQUE,
    body          TEXT NOT NULL,
    status        VARCHAR(20) DEFAULT 'DRAFT',
    view_count    INT DEFAULT 0,
    helpful_yes   INT DEFAULT 0,
    helpful_no    INT DEFAULT 0,
    author_id     UUID NOT NULL REFERENCES users(id),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at    TIMESTAMP WITH TIME ZONE
);

INSERT INTO kb_categories (name, description, icon, sort_order) VALUES
    ('Getting Started', 'New user guides and setup instructions', 'pi-play', 1),
    ('Billing & Accounts', 'Billing questions and account management', 'pi-credit-card', 2),
    ('Technical Issues', 'Troubleshooting and technical support', 'pi-wrench', 3),
    ('General FAQ', 'Frequently asked questions', 'pi-question-circle', 4);
