CREATE TABLE IF NOT EXISTS patient_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    visit_id UUID,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_content_type VARCHAR(100),
    file_size BIGINT,
    storage_path TEXT NOT NULL,
    description TEXT,
    uploaded_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_patient_documents_patient ON patient_documents(patient_id);
