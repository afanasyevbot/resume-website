-- Store the full structured tailored package as JSONB. The discrete
-- cover_letter / outreach_draft columns stay for backward compatibility
-- but new code writes the whole TailoredPackage shape into package_json.
alter table application_packages add column if not exists package_json jsonb;
