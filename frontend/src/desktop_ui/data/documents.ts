export interface DocumentTemplate {
  id: string;
  apiDocType: string;
  category: string;
  name: string;
  description: string;
  act: string;
  fee: string;
  estMinutes: number;
  featured?: boolean;
  generatedThisMonth?: number;
  fields: DocumentField[];
}

export interface DocumentField {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "tel" | "email" | "number" | "select";
  placeholder?: string;
  required: boolean;
  options?: string[];
  hint?: string;
}

export const DOCUMENT_CATEGORIES = [
  "All", "RTI", "Consumer", "Criminal", "Labour", "Civil", "Workplace", "Property",
];

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "rti_application", apiDocType: "rti_application", category: "RTI",
    name: "RTI Application", act: "Right to Information Act, 2005", fee: "₹10", estMinutes: 3,
    featured: true, generatedThisMonth: 4821,
    description: "Request information from any government department under RTI Act, 2005.",
    fields: [
      { key: "applicant_name",      label: "Your Full Name",                type: "text",     placeholder: "Priya Desai",                      required: true },
      { key: "applicant_address",   label: "Your Address",                  type: "textarea", placeholder: "House No, Street, City, State, PIN", required: true },
      { key: "applicant_phone",     label: "Phone Number",                  type: "tel",      placeholder: "9876543210",                       required: true },
      { key: "applicant_email",     label: "Email Address",                 type: "email",    placeholder: "you@email.com",                    required: false },
      { key: "public_authority",    label: "Public Authority / Department", type: "text",     placeholder: "Municipal Corporation of Bengaluru",required: true },
      { key: "information_sought",  label: "Information Sought",            type: "textarea", placeholder: "Please provide copies of all records pertaining to...", required: true, hint: "Be as specific as possible. Vague requests are more likely to be rejected." },
      { key: "preferred_mode",      label: "Preferred Mode",                type: "select",   options: ["Online", "Physical / In-person", "By Post", "By Email"], required: true },
      { key: "date_of_application", label: "Date of Application",           type: "date",     required: true },
    ],
  },
  {
    id: "consumer_complaint", apiDocType: "consumer_complaint", category: "Consumer",
    name: "Consumer Complaint", act: "Consumer Protection Act, 2019", fee: "Variable", estMinutes: 5,
    featured: true, generatedThisMonth: 3102,
    description: "File a complaint against a seller or service provider for defective products or poor service.",
    fields: [
      { key: "complainant_name",      label: "Your Full Name",        type: "text",     placeholder: "Arjun Kumar",          required: true },
      { key: "complainant_address",   label: "Your Address",          type: "textarea", placeholder: "Full address",          required: true },
      { key: "complainant_phone",     label: "Your Phone",            type: "tel",      placeholder: "9876543210",           required: true },
      { key: "complainant_email",     label: "Your Email",            type: "email",    placeholder: "you@email.com",        required: false },
      { key: "seller_name",           label: "Seller / Company Name", type: "text",     placeholder: "XYZ Electronics",      required: true },
      { key: "seller_address",        label: "Seller Address",        type: "textarea", placeholder: "Shop / office address", required: true },
      { key: "seller_phone",          label: "Seller Phone",          type: "tel",      placeholder: "Seller contact",       required: false },
      { key: "product_service",       label: "Product / Service",     type: "text",     placeholder: "Samsung LED TV 55\"",  required: true },
      { key: "purchase_date",         label: "Date of Purchase",      type: "date",     required: true },
      { key: "amount_paid",           label: "Amount Paid (₹)",       type: "number",   placeholder: "45000",                required: true },
      { key: "complaint_description", label: "Describe the Problem",  type: "textarea", placeholder: "The product stopped working after 2 weeks...", required: true },
      { key: "relief_sought",         label: "Relief Sought",         type: "textarea", placeholder: "Full refund / replacement / compensation", required: true },
      { key: "complaint_date",        label: "Date of Complaint",     type: "date",     required: true },
    ],
  },
  {
    id: "fir_draft", apiDocType: "fir_draft", category: "Criminal",
    name: "FIR / Police Complaint Draft", act: "BNS 2023 / BNSS 2023", fee: "Free", estMinutes: 5,
    description: "Draft a formal complaint to the police station for any cognisable offence under BNS 2023.",
    fields: [
      { key: "police_station",            label: "Police Station",              type: "text",     placeholder: "Jayanagar Police Station",  required: true },
      { key: "station_district",          label: "District",                    type: "text",     placeholder: "Bengaluru South",          required: true },
      { key: "state",                     label: "State",                       type: "text",     placeholder: "Karnataka",                required: true },
      { key: "offence_type",              label: "Nature of Offence",           type: "text",     placeholder: "Theft / Assault / Fraud",  required: true },
      { key: "complainant_name",          label: "Your Full Name",              type: "text",     placeholder: "Ravi Shankar",             required: true },
      { key: "complainant_age",           label: "Your Age",                    type: "number",   placeholder: "35",                       required: true },
      { key: "complainant_parent_spouse", label: "Father's / Spouse's Name",   type: "text",     placeholder: "S/o Ramesh Kumar",         required: true },
      { key: "complainant_address",       label: "Your Address",                type: "textarea", placeholder: "Full residential address", required: true },
      { key: "complainant_phone",         label: "Your Phone",                  type: "tel",      placeholder: "9876543210",               required: true },
      { key: "complainant_email",         label: "Your Email",                  type: "email",    placeholder: "you@email.com",            required: false },
      { key: "accused_name",              label: "Name of Accused",             type: "text",     placeholder: "If known, else Unknown",   required: false },
      { key: "accused_address",           label: "Accused Address",             type: "textarea", placeholder: "If known",                 required: false },
      { key: "accused_relationship",      label: "Relationship to You",         type: "text",     placeholder: "Neighbour / Stranger",     required: false },
      { key: "incident_date",             label: "Date of Incident",            type: "date",     required: true },
      { key: "incident_time",             label: "Time of Incident",            type: "text",     placeholder: "10:30 AM",                 required: true },
      { key: "incident_location",         label: "Location of Incident",        type: "text",     placeholder: "Near Bus Stand, 5th Main", required: true },
      { key: "bns_sections",              label: "BNS Sections (if known)",     type: "text",     placeholder: "e.g. Sec 303 BNS",         required: false, hint: "Leave blank if unsure." },
      { key: "incident_description",      label: "Full Account of Incident",    type: "textarea", placeholder: "Describe exactly what happened...", required: true },
      { key: "witnesses",                 label: "Witnesses",                   type: "textarea", placeholder: "Name, address, phone",     required: false },
      { key: "evidence_available",        label: "Evidence Available",          type: "textarea", placeholder: "CCTV, photos, receipts...", required: false },
      { key: "complaint_date",            label: "Date of Complaint",           type: "date",     required: true },
      { key: "complainant_city",          label: "Your City",                   type: "text",     placeholder: "Bengaluru",                required: true },
    ],
  },
  {
    id: "bail_application", apiDocType: "bail_application", category: "Criminal",
    name: "Bail Application", act: "BNSS 2023 (formerly CrPC s.437)", fee: "Court fees", estMinutes: 7,
    description: "Draft a bail application to be filed before the Sessions Court under BNSS 2023.",
    fields: [
      { key: "court_name",          label: "Court Name",                  type: "text",     placeholder: "Additional Sessions Court",  required: true },
      { key: "court_jurisdiction",  label: "Court Jurisdiction",          type: "text",     placeholder: "Greater Mumbai",             required: true },
      { key: "year",                label: "Year",                        type: "text",     placeholder: "2025",                       required: true },
      { key: "accused_name",        label: "Accused Full Name",           type: "text",     placeholder: "Full legal name",            required: true },
      { key: "accused_age",         label: "Accused Age",                 type: "number",   placeholder: "28",                         required: true },
      { key: "accused_parent",      label: "Father's / Mother's Name",    type: "text",     placeholder: "S/o Ramesh Kumar",           required: true },
      { key: "accused_address",     label: "Accused Address",             type: "textarea", placeholder: "Full residential address",   required: true },
      { key: "state",               label: "State",                       type: "text",     placeholder: "Maharashtra",                required: true },
      { key: "fir_number",          label: "FIR Number",                  type: "text",     placeholder: "FIR No. 123/2025",           required: true },
      { key: "fir_date",            label: "Date of FIR",                 type: "date",     required: true },
      { key: "police_station",      label: "Police Station",              type: "text",     placeholder: "Andheri Police Station",     required: true },
      { key: "offence_sections",    label: "Offence Sections",            type: "text",     placeholder: "Sec 115, 303 BNS 2023",      required: true },
      { key: "arrest_date",         label: "Date of Arrest",              type: "date",     required: true },
      { key: "application_date",    label: "Date of Application",         type: "date",     required: true },
      { key: "case_facts",          label: "Brief Facts of the Case",     type: "textarea", placeholder: "The accused was arrested on...", required: true },
      { key: "custom_ground_1",     label: "Ground for Bail (1)",         type: "textarea", placeholder: "No prior criminal record",   required: true },
      { key: "custom_ground_2",     label: "Ground for Bail (2)",         type: "textarea", placeholder: "Currently pursuing studies", required: false },
      { key: "verification_place",  label: "Verification Place",          type: "text",     placeholder: "Mumbai",                     required: true },
    ],
  },
  {
    id: "labour_agreement", apiDocType: "labour_agreement", category: "Labour",
    name: "Labour / Employment Agreement", act: "Contract Labour Act, 1970", fee: "Stamp duty per state", estMinutes: 8,
    description: "Create a formal employment contract between employer and employee as per Indian labour law.",
    fields: [
      { key: "agreement_date",       label: "Day of Agreement",          type: "number",   placeholder: "15",                        required: true },
      { key: "agreement_month",      label: "Month",                     type: "text",     placeholder: "January",                   required: true },
      { key: "agreement_year",       label: "Year",                      type: "text",     placeholder: "2025",                      required: true },
      { key: "agreement_place",      label: "City",                      type: "text",     placeholder: "Bengaluru",                 required: true },
      { key: "employer_name",        label: "Employer Full Name",        type: "text",     placeholder: "Suresh Sharma",             required: true },
      { key: "employer_age",         label: "Employer Age",              type: "number",   placeholder: "45",                        required: true },
      { key: "employer_designation", label: "Employer Designation",      type: "text",     placeholder: "Managing Director",         required: true },
      { key: "employer_company",     label: "Company Name",              type: "text",     placeholder: "ABC Technologies Pvt Ltd",  required: true },
      { key: "employer_address",     label: "Company Address",           type: "textarea", placeholder: "Registered office address", required: true },
      { key: "employee_name",        label: "Employee Full Name",        type: "text",     placeholder: "Anita Rao",                 required: true },
      { key: "employee_age",         label: "Employee Age",              type: "number",   placeholder: "26",                        required: true },
      { key: "employee_parent",      label: "Father's / Mother's Name",  type: "text",     placeholder: "D/o Krishnamurthy",         required: true },
      { key: "employee_address",     label: "Employee Address",          type: "textarea", placeholder: "Residential address",       required: true },
      { key: "employee_designation", label: "Designation Offered",       type: "text",     placeholder: "Software Engineer",         required: true },
      { key: "start_date",           label: "Employment Start Date",     type: "date",     required: true },
      { key: "monthly_salary",       label: "Monthly Salary (₹)",        type: "number",   placeholder: "35000",                     required: true },
      { key: "salary_in_words",      label: "Salary in Words",           type: "text",     placeholder: "Thirty-five Thousand Only", required: true },
      { key: "salary_day",           label: "Salary Payment Day (1-31)", type: "number",   placeholder: "5",                         required: true },
      { key: "working_hours",        label: "Daily Working Hours",       type: "number",   placeholder: "8",                         required: true },
      { key: "working_days",         label: "Working Days / Week",       type: "number",   placeholder: "6",                         required: true },
      { key: "annual_leave",         label: "Annual Earned Leave Days",  type: "number",   placeholder: "15",                        required: true },
      { key: "sick_leave",           label: "Sick Leave Days / Year",    type: "number",   placeholder: "12",                        required: true },
      { key: "casual_leave",         label: "Casual Leave Days / Year",  type: "number",   placeholder: "8",                         required: true },
      { key: "non_compete_period",   label: "Non-Compete Period (years)",type: "number",   placeholder: "2",                         required: true },
      { key: "notice_period",        label: "Notice Period (days)",      type: "number",   placeholder: "30",                        required: true },
      { key: "additional_clauses",   label: "Additional Clauses",        type: "textarea", placeholder: "Any specific terms...",      required: false },
    ],
  },
  {
    id: "legal_notice", apiDocType: "legal_notice", category: "Civil",
    name: "Legal Notice", act: "Civil / Contract law (general)", fee: "Advocate fees if sent through lawyer", estMinutes: 5,
    description: "Send a formal legal notice for money recovery, property disputes, or breach of contract.",
    fields: [
      { key: "sender_name",           label: "Your Full Name",           type: "text",     placeholder: "Meera Krishnan",              required: true },
      { key: "sender_address",        label: "Your Address",             type: "textarea", placeholder: "Full address",                required: true },
      { key: "sender_phone",          label: "Your Phone",               type: "tel",      placeholder: "9876543210",                  required: true },
      { key: "sender_email",          label: "Your Email",               type: "email",    placeholder: "you@email.com",               required: false },
      { key: "sender_city",           label: "Your City",                type: "text",     placeholder: "Chennai",                     required: true },
      { key: "recipient_name",        label: "Recipient Full Name",      type: "text",     placeholder: "Rajesh Gupta",                required: true },
      { key: "recipient_designation", label: "Recipient Designation",    type: "text",     placeholder: "Director / Owner (optional)", required: false },
      { key: "recipient_address",     label: "Recipient Full Address",   type: "textarea", placeholder: "Full address for service",    required: true },
      { key: "notice_date",           label: "Date of Notice",           type: "date",     required: true },
      { key: "notice_subject",        label: "Subject of Notice",        type: "text",     placeholder: "Recovery of dues",            required: true },
      { key: "background_facts",      label: "Background Facts",         type: "textarea", placeholder: "On [date], you entered into an agreement...", required: true },
      { key: "breach_description",    label: "Default / Breach",         type: "textarea", placeholder: "Despite reminders, you failed to...", required: true },
      { key: "legal_provisions",      label: "Applicable Law / Sections",type: "text",     placeholder: "Section 138 NI Act / Contract law", required: false },
      { key: "demand_1",              label: "Demand 1",                 type: "text",     placeholder: "Pay Rs. X immediately",       required: true },
      { key: "demand_2",              label: "Demand 2 (optional)",      type: "text",     placeholder: "Return documents",            required: false },
      { key: "demand_3",              label: "Demand 3 (optional)",      type: "text",     placeholder: "",                            required: false },
      { key: "compliance_days",       label: "Days to Comply",           type: "number",   placeholder: "15",                          required: true },
    ],
  },
  {
    id: "affidavit", apiDocType: "affidavit", category: "Civil",
    name: "Affidavit (General Purpose)", act: "Bharatiya Sakshya Adhiniyam 2023", fee: "Stamp paper ₹20–₹50 + Notary", estMinutes: 4,
    description: "A sworn statement of facts for court filings, name changes, address proof, or any official purpose.",
    fields: [
      { key: "deponent_name",          label: "Deponent Full Name",       type: "text",     placeholder: "Kavya Reddy",                 required: true },
      { key: "deponent_age",           label: "Deponent Age",             type: "number",   placeholder: "32",                          required: true },
      { key: "deponent_parent_spouse", label: "Father's / Spouse's Name", type: "text",     placeholder: "D/o Narayana Reddy",          required: true },
      { key: "deponent_occupation",    label: "Occupation",               type: "text",     placeholder: "Software Professional",       required: true },
      { key: "deponent_address",       label: "Residential Address",      type: "textarea", placeholder: "Full address",                required: true },
      { key: "court_name",             label: "Court Name (if any)",      type: "text",     placeholder: "Leave blank if not court-filed", required: false },
      { key: "court_jurisdiction",     label: "Court Jurisdiction",       type: "text",     placeholder: "City Civil Court, Bengaluru", required: false },
      { key: "case_number",            label: "Case Number",              type: "text",     placeholder: "If applicable",               required: false },
      { key: "affidavit_statement",    label: "Main Statement / Facts",   type: "textarea", placeholder: "I solemnly affirm that I am the same person who...", required: true, hint: "Be specific and factual. These are the sworn statements." },
      { key: "additional_statement",   label: "Additional Statement",     type: "textarea", placeholder: "Optional additional facts",   required: false },
      { key: "verification_place",     label: "Place of Verification",    type: "text",     placeholder: "Bengaluru",                   required: true },
      { key: "affidavit_date",         label: "Date of Affidavit",        type: "date",     required: true },
    ],
  },
  {
    id: "posh_complaint", apiDocType: "posh_complaint", category: "Workplace",
    name: "Workplace Harassment Complaint (POSH)", act: "POSH Act, 2013", fee: "Free — employer must receive", estMinutes: 7,
    description: "File a formal complaint of sexual harassment at the workplace under POSH Act, 2013.",
    fields: [
      { key: "complaint_date",          label: "Date of Complaint",         type: "date",     required: true },
      { key: "company_name",            label: "Company / Organisation",    type: "text",     placeholder: "ABC Pvt Ltd",                required: true },
      { key: "complainant_name",        label: "Your Full Name",            type: "text",     placeholder: "Divya Sharma",               required: true },
      { key: "designation",             label: "Your Designation",          type: "text",     placeholder: "Senior Analyst",             required: true },
      { key: "department",              label: "Your Department",           type: "text",     placeholder: "Finance",                    required: true },
      { key: "employee_id",             label: "Your Employee ID",          type: "text",     placeholder: "EMP001",                     required: true },
      { key: "contact_no",              label: "Your Contact Number",       type: "tel",      placeholder: "9876543210",                 required: true },
      { key: "respondent_name",         label: "Name of Accused",           type: "text",     placeholder: "Full name",                  required: true },
      { key: "respondent_designation",  label: "Accused Designation",       type: "text",     placeholder: "Manager / Director",         required: true },
      { key: "respondent_department",   label: "Accused Department",        type: "text",     placeholder: "Department name",            required: true },
      { key: "incident_date",           label: "Date of Incident",          type: "date",     required: true },
      { key: "incident_time",           label: "Time of Incident",          type: "text",     placeholder: "2:30 PM",                    required: true },
      { key: "incident_location",       label: "Location of Incident",      type: "text",     placeholder: "Conference Room 3, 4th Floor",required: true },
      { key: "incident_description",    label: "Describe the Incident",     type: "textarea", placeholder: "On [date], at [location]...", required: true },
      { key: "witnesses",               label: "Witnesses",                 type: "text",     placeholder: "Names of witnesses",         required: false },
      { key: "work_impact",             label: "Impact on Work",            type: "textarea", placeholder: "Unable to concentrate...",   required: true },
      { key: "emotional_impact",        label: "Emotional Impact",          type: "textarea", placeholder: "Anxiety, stress...",         required: true },
    ],
  },
  {
    id: "tenant_defense", apiDocType: "tenant_defense", category: "Property",
    name: "Tenant Defense Statement", act: "Residential Tenancy Act (State-specific)", fee: "Court fees", estMinutes: 5,
    description: "Written statement in defense of an eviction petition filed against a tenant.",
    fields: [
      { key: "landlord_name",      label: "Landlord's Name",           type: "text",     placeholder: "Mohan Lal",       required: true },
      { key: "tenant_name",        label: "Your Name (Tenant)",        type: "text",     placeholder: "Pradeep Singh",   required: true },
      { key: "case_number",        label: "Case Number",               type: "text",     placeholder: "If unknown leave blank", required: false },
      { key: "property_address",   label: "Property Address",          type: "textarea", placeholder: "Full rented property address", required: true },
      { key: "property_type",      label: "Property Type",             type: "select",   options: ["Residential", "Commercial"], required: true },
      { key: "rent_amount",        label: "Monthly Rent (₹)",          type: "number",   placeholder: "12000",           required: true },
      { key: "tenancy_start_date", label: "Tenancy Start Date",        type: "date",     required: true },
      { key: "notice_period_days", label: "Days Notice Given by Landlord", type: "number", placeholder: "15",            required: true },
      { key: "date_of_statement",  label: "Date of This Statement",    type: "date",     required: true },
    ],
  },
];
