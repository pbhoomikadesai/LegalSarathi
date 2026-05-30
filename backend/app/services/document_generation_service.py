"""
Document Generation Service
Uses Jinja2 to render legal document templates with user-provided data.

Supported document types:
  - rti_application       (Right to Information Act, 2005)
  - consumer_complaint    (Consumer Protection Act, 2019)
  - tenant_defense        (Residential Tenancy — state-specific)
  - posh_complaint        (POSH Act, 2013)
  - bail_application      (BNSS 2023, formerly CrPC s.437)
  - fir_draft             (BNSS 2023 / BNS 2023)
  - labour_agreement      (Contract Labour Act, 1970)
  - legal_notice          (General civil / money recovery)
  - affidavit             (General purpose, notarised)
"""

from jinja2 import Environment, FileSystemLoader, TemplateNotFound
from pathlib import Path
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class DocumentGenerationService:

    # ── Field definitions ────────────────────────────────────────────────────
    FIELD_MAPPINGS: Dict[str, Dict[str, str]] = {
        "rti_application": {
            "applicant_name":      "Full name of the applicant",
            "applicant_address":   "Residential address",
            "applicant_phone":     "Contact phone number (10 digits)",
            "applicant_email":     "Email address",
            "public_authority":    "Name of the public authority / department",
            "information_sought":  "Specific information being requested (detailed)",
            "preferred_mode":      "Mode of delivery (Online / Physical / Email)",
            "date_of_application": "Date of application (DD-MM-YYYY)",
        },
        "consumer_complaint": {
            "complainant_name":        "Full name of complainant",
            "complainant_address":     "Address of complainant",
            "complainant_phone":       "Phone number",
            "complainant_email":       "Email address",
            "seller_name":             "Name of seller / service provider",
            "seller_address":          "Address of seller",
            "seller_phone":            "Phone of seller",
            "product_service":         "Description of product / service purchased",
            "purchase_date":           "Date of purchase (DD-MM-YYYY)",
            "amount_paid":             "Amount paid in rupees (numbers only)",
            "complaint_description":   "Detailed description of the complaint",
            "relief_sought":           "Relief / compensation being sought",
            "complaint_date":          "Date of complaint (DD-MM-YYYY)",
        },
        "tenant_defense": {
            "landlord_name":        "Name of landlord / plaintiff",
            "tenant_name":          "Name of tenant / respondent",
            "case_number":          "Court case number (if available, else leave blank)",
            "property_address":     "Full address of the property",
            "property_type":        "Type of property (Residential / Commercial)",
            "rent_amount":          "Monthly rent amount (numbers only)",
            "tenancy_start_date":   "Date tenancy started (DD-MM-YYYY)",
            "notice_period_days":   "Number of days' notice given by landlord",
            "date_of_statement":    "Date of this statement (DD-MM-YYYY)",
        },
        "posh_complaint": {
            "complaint_date":        "Date of complaint (DD-MM-YYYY)",
            "company_name":          "Name of company / organization",
            "complainant_name":      "Name of person filing complaint",
            "designation":           "Job designation of complainant",
            "department":            "Department name",
            "employee_id":           "Employee ID number",
            "contact_no":            "Contact number of complainant",
            "respondent_name":       "Name of person accused",
            "respondent_designation": "Designation of respondent",
            "respondent_department": "Department of respondent",
            "incident_date":         "Date of incident (DD-MM-YYYY)",
            "incident_time":         "Time of incident (HH:MM)",
            "incident_location":     "Location / place of incident",
            "incident_description":  "Detailed description of the harassment",
            "witnesses":             "Names of witnesses (if any)",
            "work_impact":           "Impact on work performance / productivity",
            "emotional_impact":      "Emotional / psychological impact",
        },
        "bail_application": {
            "court_name":            "Full name of the court (e.g. Additional Sessions Court)",
            "court_jurisdiction":    "Court jurisdiction (e.g. Greater Mumbai)",
            "year":                  "Year (YYYY)",
            "accused_name":          "Full name of the accused / applicant",
            "accused_age":           "Age of the accused",
            "accused_parent":        "Father's / mother's name",
            "accused_address":       "Residential address of the accused",
            "state":                 "State (e.g. Maharashtra, Karnataka)",
            "fir_number":            "FIR number and year",
            "fir_date":              "Date of FIR (DD-MM-YYYY)",
            "police_station":        "Name of the police station",
            "offence_sections":      "BNS sections charged (e.g. Sec 103, 115 BNS 2023)",
            "arrest_date":           "Date of arrest (DD-MM-YYYY)",
            "application_date":      "Date of this application (DD-MM-YYYY)",
            "case_facts":            "Brief facts of the case (in 3-5 sentences)",
            "custom_ground_1":       "Additional ground for bail (e.g. no prior criminal record)",
            "custom_ground_2":       "Additional ground for bail (e.g. employed / student)",
            "verification_place":    "City / place of verification",
        },
        "fir_draft": {
            "police_station":               "Name of the police station",
            "station_district":             "District of the police station",
            "state":                        "State (e.g. Karnataka, Maharashtra)",
            "offence_type":                 "Nature of offence (e.g. Theft, Assault, Fraud)",
            "complainant_name":             "Full name of the complainant",
            "complainant_age":              "Age of the complainant",
            "complainant_parent_spouse":    "Father's / Spouse's name",
            "complainant_address":          "Residential address",
            "complainant_phone":            "Phone number (10 digits)",
            "complainant_email":            "Email address",
            "complainant_aadhaar":          "Aadhaar number (optional)",
            "accused_name":                 "Name of the accused (if known)",
            "accused_address":              "Address of the accused (if known)",
            "accused_relationship":         "Relationship to complainant (if any)",
            "incident_date":                "Date of the incident (DD-MM-YYYY)",
            "incident_time":                "Time of the incident",
            "incident_location":            "Place where the incident occurred",
            "bns_sections":                 "Applicable BNS 2023 sections (if known)",
            "incident_description":         "Full detailed account of what happened",
            "witnesses":                    "Names and addresses of witnesses (if any)",
            "evidence_available":           "Evidence / documents available",
            "additional_relief":            "Any specific relief requested",
            "complaint_date":               "Date of this complaint (DD-MM-YYYY)",
            "complainant_city":             "City of the complainant",
        },
        "labour_agreement": {
            "agreement_date":       "Day number (e.g. 5)",
            "agreement_month":      "Month name (e.g. January)",
            "agreement_year":       "Year (YYYY)",
            "agreement_place":      "City where agreement is signed",
            "employer_name":        "Full name of the employer",
            "employer_age":         "Age of the employer",
            "employer_designation": "Designation / title of employer",
            "employer_company":     "Name of the company / organisation",
            "employer_address":     "Address of the employer / company",
            "employee_name":        "Full name of the employee",
            "employee_age":         "Age of the employee",
            "employee_parent":      "Father's / mother's name",
            "employee_address":     "Residential address of the employee",
            "employee_designation": "Designation / role offered",
            "start_date":           "Employment start date (DD-MM-YYYY)",
            "monthly_salary":       "Monthly salary in numbers",
            "salary_in_words":      "Monthly salary in words",
            "salary_day":           "Day of month salary is paid (e.g. 5)",
            "working_hours":        "Daily working hours (e.g. 8)",
            "working_days":         "Working days per week (e.g. 6)",
            "annual_leave":         "Annual earned leave days",
            "sick_leave":           "Sick leave days per year",
            "casual_leave":         "Casual leave days per year",
            "non_compete_period":   "Non-compete period in years after leaving",
            "notice_period":        "Notice period in days",
            "additional_clauses":   "Any additional terms or conditions (optional)",
        },
        "legal_notice": {
            "sender_name":          "Full name of the person sending notice",
            "sender_address":       "Address of sender",
            "sender_phone":         "Phone number of sender",
            "sender_email":         "Email of sender",
            "sender_city":          "City of sender",
            "recipient_name":       "Full name of the recipient / noticee",
            "recipient_designation": "Designation of recipient (if applicable)",
            "recipient_address":    "Full address of the recipient",
            "notice_date":          "Date of this notice (DD-MM-YYYY)",
            "notice_subject":       "Subject / purpose of the notice (e.g. Recovery of dues)",
            "background_facts":     "Background and factual context of the dispute",
            "breach_description":   "Description of the default / breach committed by recipient",
            "legal_provisions":     "Applicable laws / sections (e.g. Section 138 NI Act)",
            "demand_1":             "First specific demand",
            "demand_2":             "Second demand (optional)",
            "demand_3":             "Third demand (optional)",
            "compliance_days":      "Days given to comply (default: 15)",
        },
        "affidavit": {
            "deponent_name":            "Full name of the person swearing the affidavit",
            "deponent_age":             "Age of the deponent",
            "deponent_parent_spouse":   "Father's / Spouse's name",
            "deponent_occupation":      "Occupation of the deponent",
            "deponent_address":         "Residential address",
            "court_name":               "Name of court (if filed in court, else leave blank)",
            "court_jurisdiction":       "Court jurisdiction",
            "case_number":              "Case / application number (if applicable)",
            "affidavit_statement":      "Main statements / facts to be affirmed (be specific)",
            "additional_statement":     "Additional statement (optional)",
            "total_paras":              "Total number of statement paragraphs (default: 5)",
            "verification_place":       "City / place of verification",
            "affidavit_date":           "Date of affidavit (DD-MM-YYYY)",
        },
    }

    # ── Document metadata ─────────────────────────────────────────────────────
    DOC_INFO: Dict[str, Dict[str, str]] = {
        "rti_application":   {"title": "RTI Application",          "act": "Right to Information Act, 2005",                               "fee": "₹10", "est_minutes": "3"},
        "consumer_complaint":{"title": "Consumer Complaint",       "act": "Consumer Protection Act, 2019",                               "fee": "Variable", "est_minutes": "5"},
        "tenant_defense":    {"title": "Tenant Defense Statement", "act": "Residential Tenancy Act (State-specific)",                     "fee": "Court fees", "est_minutes": "5"},
        "posh_complaint":    {"title": "POSH / Workplace Harassment Complaint", "act": "POSH Act, 2013",                                   "fee": "Free", "est_minutes": "7"},
        "bail_application":  {"title": "Bail Application",        "act": "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)",              "fee": "Court fees", "est_minutes": "7"},
        "fir_draft":         {"title": "FIR / Police Complaint Draft", "act": "BNS 2023 / BNSS 2023",                                      "fee": "Free", "est_minutes": "5"},
        "labour_agreement":  {"title": "Labour / Employment Agreement", "act": "Contract Labour Act, 1970",                               "fee": "Stamp duty", "est_minutes": "8"},
        "legal_notice":      {"title": "Legal Notice",             "act": "Civil / Criminal law (general)",                               "fee": "Advocate fees if sent through lawyer", "est_minutes": "5"},
        "affidavit":         {"title": "Affidavit (General Purpose)", "act": "Indian Evidence Act / BSA 2023",                            "fee": "Stamp paper ₹20–₹50 + Notary", "est_minutes": "4"},
    }

    def __init__(self):
        template_dir = Path(__file__).parent.parent / "templates"
        if not template_dir.exists():
            raise FileNotFoundError(f"Templates directory not found at {template_dir}")
        self.env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=True,
            trim_blocks=True,
            lstrip_blocks=True,
        )
        self.template_dir = template_dir
        logger.info(f"DocumentGenerationService ready. Template dir: {template_dir}")

    def get_available_templates(self) -> Dict[str, list]:
        available = {}
        try:
            for doc_dir in self.template_dir.iterdir():
                if doc_dir.is_dir() and not doc_dir.name.startswith("_"):
                    templates = [f.stem for f in doc_dir.glob("*.jinja2")]
                    if templates:
                        available[doc_dir.name] = sorted(templates)
        except Exception as e:
            logger.error(f"Error scanning templates: {e}")
        return available

    def render_document(
        self,
        doc_type: str,
        language: str = "english",
        data: Optional[Dict[str, Any]] = None,
    ) -> str:
        if data is None:
            data = {}
        template_path = f"{doc_type}/{language}.jinja2"
        try:
            template = self.env.get_template(template_path)
            return template.render(**data)
        except TemplateNotFound:
            available = self.get_available_templates()
            raise TemplateNotFound(
                f"Template '{language}' not found for '{doc_type}'. "
                f"Available: {list(available.keys())}"
            )
        except Exception as e:
            raise ValueError(f"Error rendering document: {e}")

    def get_required_fields(self, doc_type: str, language: str = "english") -> Dict[str, str]:
        return self.FIELD_MAPPINGS.get(doc_type, {})

    def get_document_info(self, doc_type: str) -> Dict[str, Any]:
        return self.DOC_INFO.get(doc_type, {
            "title": doc_type.replace("_", " ").title(),
            "act": "Indian Law",
            "fee": "Check with authority",
            "est_minutes": "5",
        })

    def validate_document_type(self, doc_type: str) -> bool:
        return doc_type in self.get_available_templates()

    def validate_language(self, doc_type: str, language: str) -> bool:
        avail = self.get_available_templates()
        return doc_type in avail and language in avail[doc_type]
