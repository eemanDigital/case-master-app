const templateSeeds = [
  {
    title: "Nigerian Employment Agreement",
    description:
      "Standard employment contract compliant with the Labour Act Cap L1 LFN 2004. Suitable for full-time employees in Nigerian companies.",
    category: "contract",
    subcategory: "employment",
    practiceArea: "employment-labour",
    isSystemTemplate: true,
    content: `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is made and entered into this {{COMMENCEMENT_DATE}} day of {{YEAR}} by and between:

{{FIRM_NAME}} (hereinafter referred to as "the Employer")
AND
{{EMPLOYEE_NAME}} of {{EMPLOYEE_ADDRESS}} (hereinafter referred to as "the Employee")

WITNESSETH THAT:

1. POSITION AND DUTIES
The Employer hereby employs the Employee as {{JOB_TITLE}} and the Employee agrees to serve in that capacity. The Employee shall perform all duties and responsibilities associated with this position as may be assigned from time to time by the Employer.

2. COMMENCEMENT AND TERM
This Agreement shall commence on {{COMMENCEMENT_DATE}} and shall continue until terminated in accordance with the provisions of this Agreement.

3. REMUNERATION
3.1 The Employee shall be paid an annual salary of ₦{{SALARY_AMOUNT}} (Naira {{SALARY_WORDS}}) payable in monthly installments.

3.2 The Employer shall deduct all statutory deductions including but not limited to:
- Pay As You Earn (PAYE)
- National Housing Fund (NHF)
- National Insurance Contribution (NIC)

4. WORKING HOURS
The Employee shall work for {{WORKING_HOURS}} hours per week, from Monday to Friday, unless otherwise directed by the Employer. The Employee may be required to work overtime as may be reasonably required.

5. LEAVE ENTITLEMENT
The Employee shall be entitled to:
- Annual Leave: {{ANNUAL_LEAVE_DAYS}} working days
- Sick Leave: {{SICK_LEAVE_DAYS}} working days
- Maternity/Paternity Leave as provided by law

6. CONFIDENTIALITY
The Employee agrees to keep confidential all proprietary information, trade secrets, and any other confidential information relating to the Employer's business.

7. TERMINATION
7.1 Either party may terminate this Agreement by giving {{NOTICE_PERIOD}} written notice to the other party.

7.2 The Employer may terminate this Agreement without notice for cause including but not limited to:
- Gross misconduct
- Breach of this Agreement
- Criminal offence
- Incompetence

8. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of {{GOVERNING_STATE}}, Nigeria.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.

_________________________                    _________________________
EMPLOYER                                        EMPLOYEE
{{FIRM_NAME}}                                   {{EMPLOYEE_NAME}}

Witness: _____________________              Witness: _____________________
Name: {{WITNESS_NAME}}                        Name: {{WITNESS2_NAME}}
Date: {{EXECUTION_DATE}}                     Date: {{EXECUTION_DATE}}
`,
    placeholders: [
      { key: "FIRM_NAME", label: "Law Firm/Company Name", type: "text", required: true, hint: "Name of the employing company or law firm" },
      { key: "EMPLOYEE_NAME", label: "Employee Full Name", type: "text", required: true, hint: "Full legal name of the employee" },
      { key: "EMPLOYEE_ADDRESS", label: "Employee Address", type: "textarea", required: true, hint: "Residential address of the employee" },
      { key: "JOB_TITLE", label: "Job Title", type: "text", required: true, hint: "Position/title of the employee" },
      { key: "COMMENCEMENT_DATE", label: "Commencement Date", type: "date", required: true, hint: "Date the employment begins" },
      { key: "YEAR", label: "Year", type: "text", required: true, hint: "Current year" },
      { key: "SALARY_AMOUNT", label: "Annual Salary Amount", type: "currency", required: true, hint: "Annual salary in Naira" },
      { key: "SALARY_WORDS", label: "Salary in Words", type: "text", required: true, hint: "Salary written in words (e.g., Five Million Naira Only)" },
      { key: "WORKING_HOURS", label: "Weekly Working Hours", type: "number", required: true, defaultValue: "40", hint: "Number of hours per week" },
      { key: "ANNUAL_LEAVE_DAYS", label: "Annual Leave Days", type: "number", required: true, defaultValue: "21", hint: "Number of annual leave days" },
      { key: "SICK_LEAVE_DAYS", label: "Sick Leave Days", type: "number", required: true, defaultValue: "14", hint: "Number of sick leave days" },
      { key: "NOTICE_PERIOD", label: "Notice Period (Days)", type: "number", required: true, defaultValue: "30", hint: "Number of days for notice period" },
      { key: "GOVERNING_STATE", label: "Governing State", type: "select", required: true, options: ["Lagos", "Abuja (FCT)", "Rivers", "Kano", "Oyo", "Ogun", "Edo", "Delta"], hint: "State whose laws govern this agreement" },
      { key: "WITNESS_NAME", label: "Witness 1 Name", type: "text", required: true, hint: "Name of first witness" },
      { key: "WITNESS2_NAME", label: "Witness 2 Name", type: "text", required: true, hint: "Name of second witness" },
      { key: "EXECUTION_DATE", label: "Execution Date", type: "date", required: true, hint: "Date of signing" }
    ],
    tags: ["employment", "labour", "contract", "Nigeria"],
    governingLaw: "Labour Act Cap L1 LFN 2004",
    status: "active",
    isFeatured: true,
  },
  {
    title: "Nigerian Non-Disclosure Agreement (NDA)",
    description:
      "Mutual non-disclosure agreement for protecting confidential information in business transactions in Nigeria.",
    category: "contract",
    subcategory: "confidentiality",
    practiceArea: "corporate-commercial",
    isSystemTemplate: true,
    content: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is made this {{EFFECTIVE_DATE}} day of {{YEAR}} between:

{{PARTY_A_NAME}} (hereinafter referred to as "Disclosing Party")
AND
{{PARTY_B_NAME}} (hereinafter referred to as "Receiving Party")

WHEREAS:

The Disclosing Party possesses certain confidential and proprietary information relating to {{PURPOSE}} and the Receiving Party desires to receive such information for the purpose of {{PURPOSE}}.

NOW THEREFORE, the parties agree as follows:

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means any and all information disclosed by the Disclosing Party to the Receiving Party, whether orally, in writing, or by inspection of tangible objects, which is designated as confidential or that reasonably should be understood to be confidential.

2. OBLIGATIONS OF RECEIVING PARTY
The Receiving Party agrees to:
a) Hold the Confidential Information in strict confidence
b) Not disclose the Confidential Information to any third party without prior written consent
c) Use the Confidential Information solely for the Purpose stated above
d) Protect the Confidential Information using the same degree of care used to protect its own confidential information

3. EXCLUSIONS
This Agreement shall not apply to information that:
a) Is or becomes publicly available through no fault of the Receiving Party
b) Was rightfully in the possession of the Receiving Party prior to disclosure
c) Is independently developed by the Receiving Party
d) Is disclosed with the written approval of the Disclosing Party

4. TERM
This Agreement shall remain in effect for {{TERM_YEARS}} years from the Effective Date, unless earlier terminated by either party upon {{NOTICE_PERIOD}} days written notice.

5. REMEDIES
The Receiving Party acknowledges that any breach of this Agreement may cause irreparable harm, and the Disclosing Party shall be entitled to seek equitable relief, including injunction and specific performance.

6. GOVERNING LAW
This Agreement shall be governed by the laws of the Federal Republic of Nigeria.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

_________________________                    _________________________
{{PARTY_A_NAME}}                             {{PARTY_B_NAME}}
(Disclosing Party)                           (Receiving Party)

Authorized Signature: _________________     Authorized Signature: _________________
Name: {{PARTY_A_SIGNATORY}}                  Name: {{PARTY_B_SIGNATORY}}
Title: {{PARTY_A_TITLE}}                     Title: {{PARTY_B_TITLE}}
Date: {{EXECUTION_DATE}}                     Date: {{EXECUTION_DATE}}
`,
    placeholders: [
      { key: "PARTY_A_NAME", label: "Disclosing Party Name", type: "text", required: true, hint: "Name of the party disclosing information" },
      { key: "PARTY_B_NAME", label: "Receiving Party Name", type: "text", required: true, hint: "Name of the party receiving information" },
      { key: "PURPOSE", label: "Purpose", type: "textarea", required: true, hint: "Purpose for which confidential information is shared" },
      { key: "EFFECTIVE_DATE", label: "Effective Date", type: "date", required: true, hint: "Date when the NDA becomes effective" },
      { key: "YEAR", label: "Year", type: "text", required: true, hint: "Current year" },
      { key: "TERM_YEARS", label: "Term (Years)", type: "number", required: true, defaultValue: "3", hint: "Duration of the NDA in years" },
      { key: "NOTICE_PERIOD", label: "Notice Period (Days)", type: "number", required: true, defaultValue: "30", hint: "Days of notice for termination" },
      { key: "PARTY_A_SIGNATORY", label: "Disclosing Party Signatory", type: "text", required: true, hint: "Name of signatory for disclosing party" },
      { key: "PARTY_B_SIGNATORY", label: "Receiving Party Signatory", type: "text", required: true, hint: "Name of signatory for receiving party" },
      { key: "PARTY_A_TITLE", label: "Disclosing Party Title", type: "text", required: true, hint: "Designation of signatory" },
      { key: "PARTY_B_TITLE", label: "Receiving Party Title", type: "text", required: true, hint: "Designation of signatory" },
      { key: "EXECUTION_DATE", label: "Execution Date", type: "date", required: true, hint: "Date of signing" }
    ],
    tags: ["nda", "confidentiality", "business", "Nigeria"],
    governingLaw: "Laws of the Federation of Nigeria 2004",
    status: "active",
    isFeatured: true,
  },
  {
    title: "Nigerian Tenancy Agreement (Residential/Commercial)",
    description:
      "Comprehensive tenancy agreement compliant with the Tenancy Law of relevant Nigerian states.",
    category: "contract",
    subcategory: "tenancy",
    practiceArea: "property-conveyancing",
    isSystemTemplate: true,
    content: `TENANCY AGREEMENT

This Tenancy Agreement is made this {{COMMENCEMENT_DATE}} day of {{YEAR}}

BETWEEN:

{{LANDLORD_NAME}} of {{LANDLORD_ADDRESS}} (hereinafter called "the Landlord")

AND

{{TENANT_NAME}} of {{TENANT_ADDRESS}} (hereinafter called "the Tenant")

WHEREAS:
The Landlord is the owner of the premises known as {{PROPERTY_ADDRESS}} (hereinafter called "the Premises").

NOW IT IS HEREBY AGREED as follows:

1. PROPERTY AND TERM
1.1 The Landlord lets to the Tenant the Premises for a term of {{TENANCY_PERIOD}} months commencing from {{COMMENCEMENT_DATE}} and ending on {{END_DATE}}.

2. RENT
2.1 The Tenant shall pay the sum of ₦{{RENT_AMOUNT}} (Naira {{RENT_WORDS}}) per annum as rent for the Premises.

2.2 Rent shall be payable {{PAYMENT_FREQUENCY}} in advance on or before the {{PAYMENT_DAY}} day of each {{PAYMENT_PERIOD}}.

2.3 The Tenant shall pay a deposit of ₦{{SECURITY_DEPOSIT}} (Naira {{DEPOSIT_WORDS}}) which shall be refundable at the expiration of this Agreement.

3. USE OF PREMISES
The Premises shall be used for {{PURPOSE}} only and for no other purpose whatsoever.

4. LANDLORD'S COVENANTS
The Landlord agrees to:
a) Allow the Tenant quiet enjoyment of the Premises
b) Keep the structure and exterior of the Premises in good repair
c) Provide essential services as agreed

5. TENANT'S COVENANTS
The Tenant agrees to:
a) Pay rent promptly when due
b) Maintain the Premises in good condition
c) Not assign or sublet without written consent
d) Not make alterations without prior permission
e) Not use the Premises for illegal purposes

6. FORFEITURE
If the Tenant fails to pay rent for {{GRACE_PERIOD}} days after it becomes due, or breaches any covenant in this Agreement, the Landlord may re-enter the Premises.

7. NOTICE
Either party shall give {{NOTICE_PERIOD}} days notice to terminate this Agreement.

8. GOVERNING LAW
This Agreement shall be governed by the laws of {{GOVERNING_STATE}}.

IN WITNESS WHEREOF the parties have set their hands the day and year first above written.

_________________________                    _________________________
LANDLORD                                       TENANT
{{LANDLORD_NAME}}                              {{TENANT_NAME}}

Witness: _____________________              Witness: _____________________
Name: {{WITNESS_NAME}}                        Name: {{WITNESS2_NAME}}
Address: {{WITNESS_ADDRESS}}                 Address: {{WITNESS2_ADDRESS}}
`,
    placeholders: [
      { key: "LANDLORD_NAME", label: "Landlord Full Name", type: "text", required: true, hint: "Full legal name of the landlord" },
      { key: "LANDLORD_ADDRESS", label: "Landlord Address", type: "textarea", required: true, hint: "Address of the landlord" },
      { key: "TENANT_NAME", label: "Tenant Full Name", type: "text", required: true, hint: "Full legal name of the tenant" },
      { key: "TENANT_ADDRESS", label: "Tenant Address", type: "textarea", required: true, hint: "Address of the tenant" },
      { key: "PROPERTY_ADDRESS", label: "Property Address", type: "textarea", required: true, hint: "Full address of the rented premises" },
      { key: "COMMENCEMENT_DATE", label: "Commencement Date", type: "date", required: true, hint: "Date when tenancy begins" },
      { key: "END_DATE", label: "End Date", type: "date", required: true, hint: "Date when tenancy ends" },
      { key: "YEAR", label: "Year", type: "text", required: true, hint: "Current year" },
      { key: "TENANCY_PERIOD", label: "Tenancy Period (Months)", type: "number", required: true, defaultValue: "12", hint: "Duration of tenancy in months" },
      { key: "RENT_AMOUNT", label: "Annual Rent Amount", type: "currency", required: true, hint: "Rent amount in Naira" },
      { key: "RENT_WORDS", label: "Rent in Words", type: "text", required: true, hint: "Rent written in words" },
      { key: "PAYMENT_FREQUENCY", label: "Payment Frequency", type: "select", required: true, options: ["annually", "quarterly", "monthly"], hint: "How often rent is paid" },
      { key: "PAYMENT_DAY", label: "Payment Day", type: "number", required: true, hint: "Day of the period when rent is due" },
      { key: "PAYMENT_PERIOD", label: "Payment Period", type: "select", required: true, options: ["month", "quarter", "year"], hint: "Period for payment" },
      { key: "SECURITY_DEPOSIT", label: "Security Deposit", type: "currency", required: true, hint: "Amount of security deposit" },
      { key: "DEPOSIT_WORDS", label: "Deposit in Words", type: "text", required: true, hint: "Security deposit written in words" },
      { key: "PURPOSE", label: "Purpose of Tenancy", type: "select", required: true, options: ["residential", "commercial", "office"], hint: "Intended use of the property" },
      { key: "GRACE_PERIOD", label: "Grace Period (Days)", type: "number", required: true, defaultValue: "7", hint: "Days before landlord can re-enter" },
      { key: "NOTICE_PERIOD", label: "Notice Period (Days)", type: "number", required: true, defaultValue: "7", hint: "Days of notice to terminate" },
      { key: "GOVERNING_STATE", label: "Governing State", type: "select", required: true, options: ["Lagos", "Abuja (FCT)", "Rivers", "Kano", "Oyo", "Ogun"], hint: "State whose tenancy laws apply" },
      { key: "WITNESS_NAME", label: "Witness 1 Name", type: "text", required: true, hint: "First witness name" },
      { key: "WITNESS2_NAME", label: "Witness 2 Name", type: "text", required: true, hint: "Second witness name" },
      { key: "WITNESS_ADDRESS", label: "Witness 1 Address", type: "textarea", required: true, hint: "First witness address" },
      { key: "WITNESS2_ADDRESS", label: "Witness 2 Address", type: "textarea", required: true, hint: "Second witness address" }
    ],
    tags: ["tenancy", "property", "rental", "Nigeria"],
    governingLaw: "Tenancy Law of {{GOVERNING_STATE}}",
    status: "active",
    isFeatured: true,
  },
  {
    title: "Deed of Assignment (Property Transfer)",
    description:
      "Legal document for transferring property ownership in Nigeria, compliant with the Land Use Act.",
    category: "contract",
    subcategory: "conveyancing",
    practiceArea: "property-conveyancing",
    isSystemTemplate: true,
    content: `DEED OF ASSIGNMENT

This Deed of Assignment is made this {{EXECUTION_DATE}} day of {{YEAR}}

BETWEEN:

{{ASSIGNOR_NAME}} of {{ASSIGNOR_ADDRESS}} (hereinafter called "the Assignor")

AND

{{ASSIGNEE_NAME}} of {{ASSIGNEE_ADDRESS}} (hereinafter called "the Assignee")

WHEREAS:
A. The Assignor is the owner of all that piece or parcel of land situated at {{PROPERTY_ADDRESS}} together with all buildings and improvements thereon (hereinafter called "the Property").

B. The Property is more particularly described in the Schedule hereto and delineated on the Survey Plan No. {{SURVEY_NUMBER}} registered at the {{REGISTRY_NAME}}.

C. The Assignor has agreed to assign to the Assignee all his right, title, and interest in the Property for the consideration hereinafter appearing.

NOW THIS DEED WITNESSETH:

1. CONSIDERATION
In consideration of the sum of ₦{{CONSIDERATION_AMOUNT}} (Naira {{CONSIDERATION_WORDS}}) now paid by the Assignee to the Assignor (receipt whereof is hereby acknowledged), the Assignor hereby assigns, transfers, and conveys unto the Assignee ALL THAT piece or parcel of land described in the Schedule hereto.

2. COVENANTS FOR TITLE
The Assignor covenants with the Assignee that:
a) The Assignor has good title to the Property
b) The Assignor has full power to assign the Property
c) The Property is free from encumbrances
d) The Assignee shall have quiet enjoyment of the Property

3. LAND USE ACT COMPLIANCE
This assignment is made with the consent of the Governor as required under Section 34 of the Land Use Act Cap L5 LFN 2004. The Assignee acknowledges that all rights of occupancy are subject to the terms and conditions contained in the Certificate of Occupancy.

4. ASSIGNEE'S COVENANTS
The Assignee agrees to:
a) Pay all rents and sums due in respect of the Property
b) Comply with all terms and conditions of the Certificate of Occupancy
c) Use the Property for {{PURPOSE}} only

5. THE SCHEDULE
(Description of the Property)
All that piece or parcel of land containing {{LAND_SIZE}} (more or less) situate at {{PROPERTY_ADDRESS}} and bounded approximately as follows:
{{BOUNDARIES}}

6. EXECUTION
IN WITNESS WHEREOF the Assignor has set his hand on the day and year first written.

_________________________
ASSIGNOR
{{ASSIGNOR_NAME}}

Signed, Sealed, and Delivered by the above-named
{{ASSIGNOR_NAME}} in the presence of:

Witness: _____________________
Name: {{WITNESS_NAME}}
Address: {{WITNESS_ADDRESS}}
Occupation: {{WITNESS_OCCUPATION}}

Signed, Sealed, and Delivered by the above-named
{{ASSIGNEE_NAME}} in the presence of:

Witness: _____________________
Name: {{WITNESS2_NAME}}
Address: {{WITNESS2_ADDRESS}}
Occupation: {{WITNESS2_OCCUPATION}}
`,
    placeholders: [
      { key: "ASSIGNOR_NAME", label: "Assignor Full Name", type: "text", required: true, hint: "Full legal name of the current property owner" },
      { key: "ASSIGNOR_ADDRESS", label: "Assignor Address", type: "textarea", required: true, hint: "Address of the assignor" },
      { key: "ASSIGNEE_NAME", label: "Assignee Full Name", type: "text", required: true, hint: "Full legal name of the new property owner" },
      { key: "ASSIGNEE_ADDRESS", label: "Assignee Address", type: "textarea", required: true, hint: "Address of the assignee" },
      { key: "PROPERTY_ADDRESS", label: "Property Address", type: "textarea", required: true, hint: "Full address of the property" },
      { key: "SURVEY_NUMBER", label: "Survey Plan Number", type: "text", required: true, hint: "Survey plan number" },
      { key: "REGISTRY_NAME", label: "Registry Name", type: "text", required: true, hint: "Name of the land registry" },
      { key: "EXECUTION_DATE", label: "Execution Date", type: "date", required: true, hint: "Date of signing" },
      { key: "YEAR", label: "Year", type: "text", required: true, hint: "Current year" },
      { key: "CONSIDERATION_AMOUNT", label: "Consideration Amount", type: "currency", required: true, hint: "Purchase price in Naira" },
      { key: "CONSIDERATION_WORDS", label: "Amount in Words", type: "text", required: true, hint: "Purchase price written in words" },
      { key: "LAND_SIZE", label: "Land Size", type: "text", required: true, hint: "Size of the land (e.g., 500 sq meters)" },
      { key: "BOUNDARIES", label: "Boundaries Description", type: "textarea", required: true, hint: "Description of property boundaries" },
      { key: "PURPOSE", label: "Purpose of Use", type: "select", required: true, options: ["residential", "commercial", "industrial", "agricultural"], hint: "Intended use of the property" },
      { key: "WITNESS_NAME", label: "Witness 1 Name", type: "text", required: true, hint: "First witness name" },
      { key: "WITNESS_ADDRESS", label: "Witness 1 Address", type: "textarea", required: true, hint: "First witness address" },
      { key: "WITNESS_OCCUPATION", label: "Witness 1 Occupation", type: "text", required: true, hint: "First witness occupation" },
      { key: "WITNESS2_NAME", label: "Witness 2 Name", type: "text", required: true, hint: "Second witness name" },
      { key: "WITNESS2_ADDRESS", label: "Witness 2 Address", type: "textarea", required: true, hint: "Second witness address" },
      { key: "WITNESS2_OCCUPATION", label: "Witness 2 Occupation", type: "text", required: true, hint: "Second witness occupation" }
    ],
    tags: ["deed", "assignment", "property", "conveyancing", "Nigeria"],
    governingLaw: "Land Use Act Cap L5 LFN 2004",
    status: "active",
    isFeatured: true,
  },
  {
    title: "Loan Agreement (Nigerian)",
    description:
      "Commercial loan agreement suitable for lending transactions in Nigeria with proper security provisions.",
    category: "contract",
    subcategory: "loan",
    practiceArea: "banking-finance",
    isSystemTemplate: true,
    content: `LOAN AGREEMENT

This Loan Agreement ("Agreement") is made this {{EXECUTION_DATE}} day of {{YEAR}}

BETWEEN:

{{LENDER_NAME}} of {{LENDER_ADDRESS}} (hereinafter called "the Lender")

AND

{{BORROWER_NAME}} of {{BORROWER_ADDRESS}} (hereinafter called "the Borrower")

WHEREAS:
The Lender has agreed to grant a loan facility to the Borrower on the terms and conditions contained herein.

NOW IT IS HEREBY AGREED:

1. LOAN AMOUNT
1.1 The Lender agrees to advance to the Borrower the sum of ₦{{PRINCIPAL_AMOUNT}} (Naira {{PRINCIPAL_WORDS}}) (hereinafter called "the Loan").

1.2 The Loan shall be disbursed to the Borrower's account No: {{ACCOUNT_NUMBER}} at {{BANK_NAME}}.

2. INTEREST
2.1 The Borrower shall pay interest on the outstanding Loan amount at the rate of {{INTEREST_RATE}}% per annum.

2.2 Interest shall be calculated on a monthly basis and shall be payable on the {{INTEREST_PAYMENT_DAY}} day of each month.

3. REPAYMENT
3.1 The Borrower shall repay the Loan in {{REPAYMENT_PERIOD}} equal monthly installments of ₦{{INSTALLMENT_AMOUNT}} each, commencing from {{FIRST_REPAYMENT_DATE}}.

3.2 The final installment shall be due on {{LAST_REPAYMENT_DATE}}.

4. SECURITY
The Loan shall be secured by:
a) {{SECURITY_DESCRIPTION}}
b) Such other security as may be required by the Lender

5. DEFAULT
5.1 The Loan shall become immediately due and payable if:
a) The Borrower fails to pay any installment when due
b) The Borrower breaches any term of this Agreement
c) Any representation made by the Borrower proves false

5.2 Upon default, interest shall accrue at {{DEFAULT_RATE}}% per annum.

6. COVENANTS
The Borrower covenants to:
a) Use the Loan for {{PURPOSE}} only
b) Maintain adequate insurance
c) Provide quarterly financial statements
d) Not incur additional debt without consent

7. GOVERNING LAW
This Agreement shall be governed by the laws of Nigeria.

IN WITNESS WHEREOF the parties have executed this Agreement.

_________________________                    _________________________
LENDER                                          BORROWER
{{LENDER_NAME}}                                 {{BORROWER_NAME}}

By: _________________________              By: _________________________
Name: {{LENDER_SIGNATORY}}                    Name: {{BORROWER_SIGNATORY}}
Title: {{LENDER_TITLE}}                       Title: {{BORROWER_TITLE}}
`,
    placeholders: [
      { key: "LENDER_NAME", label: "Lender Name", type: "text", required: true, hint: "Name of the lending institution/individual" },
      { key: "LENDER_ADDRESS", label: "Lender Address", type: "textarea", required: true, hint: "Address of the lender" },
      { key: "BORROWER_NAME", label: "Borrower Name", type: "text", required: true, hint: "Name of the borrower" },
      { key: "BORROWER_ADDRESS", label: "Borrower Address", type: "textarea", required: true, hint: "Address of the borrower" },
      { key: "EXECUTION_DATE", label: "Execution Date", type: "date", required: true, hint: "Date of signing" },
      { key: "YEAR", label: "Year", type: "text", required: true, hint: "Current year" },
      { key: "PRINCIPAL_AMOUNT", label: "Principal Amount", type: "currency", required: true, hint: "Loan amount in Naira" },
      { key: "PRINCIPAL_WORDS", label: "Amount in Words", type: "text", required: true, hint: "Loan amount written in words" },
      { key: "ACCOUNT_NUMBER", label: "Account Number", type: "text", required: true, hint: "Borrower's account number" },
      { key: "BANK_NAME", label: "Bank Name", type: "text", required: true, hint: "Name of the bank" },
      { key: "INTEREST_RATE", label: "Interest Rate (%)", type: "number", required: true, hint: "Annual interest rate" },
      { key: "INTEREST_PAYMENT_DAY", label: "Interest Payment Day", type: "number", required: true, hint: "Day of month for interest payment" },
      { key: "REPAYMENT_PERIOD", label: "Repayment Period (Months)", type: "number", required: true, hint: "Number of months for repayment" },
      { key: "INSTALLMENT_AMOUNT", label: "Monthly Installment", type: "currency", required: true, hint: "Amount of each monthly payment" },
      { key: "FIRST_REPAYMENT_DATE", label: "First Repayment Date", type: "date", required: true, hint: "Date of first installment" },
      { key: "LAST_REPAYMENT_DATE", label: "Last Repayment Date", type: "date", required: true, hint: "Date of final installment" },
      { key: "SECURITY_DESCRIPTION", label: "Security Description", type: "textarea", required: true, hint: "Description of collateral/security" },
      { key: "DEFAULT_RATE", label: "Default Interest Rate (%)", type: "number", required: true, defaultValue: "2", hint: "Interest rate on default" },
      { key: "PURPOSE", label: "Purpose of Loan", type: "text", required: true, hint: "Purpose for which loan is obtained" },
      { key: "LENDER_SIGNATORY", label: "Lender Signatory Name", type: "text", required: true, hint: "Name of lender's authorized signatory" },
      { key: "BORROWER_SIGNATORY", label: "Borrower Signatory Name", type: "text", required: true, hint: "Name of borrower's authorized signatory" },
      { key: "LENDER_TITLE", label: "Lender Signatory Title", type: "text", required: true, hint: "Designation of lender's signatory" },
      { key: "BORROWER_TITLE", label: "Borrower Signatory Title", type: "text", required: true, hint: "Designation of borrower's signatory" }
    ],
    tags: ["loan", "finance", "banking", "credit", "Nigeria"],
    governingLaw: "Banks and Other Financial Institutions Act",
    status: "active",
    isFeatured: false,
  },
  {
    title: "Service Agreement (Professional Services)",
    description:
      "Agreement for professional services between a service provider and client in Nigeria.",
    category: "contract",
    subcategory: "services",
    practiceArea: "corporate-commercial",
    isSystemTemplate: true,
    content: `SERVICE AGREEMENT

This Service Agreement ("Agreement") is made this {{EFFECTIVE_DATE}} day of {{YEAR}}

BETWEEN:

{{SERVICE_PROVIDER_NAME}} of {{SERVICE_PROVIDER_ADDRESS}} (hereinafter called "the Service Provider")

AND

{{CLIENT_NAME}} of {{CLIENT_ADDRESS}} (hereinafter called "the Client")

WHEREAS:
The Service Provider is engaged in the business of providing {{SERVICE_DESCRIPTION}} and the Client desires to engage the Service Provider to provide such services.

NOW IT IS HEREBY AGREED:

1. SCOPE OF SERVICES
The Service Provider shall provide the following services:
{{SCOPE_OF_SERVICES}}

2. TERM
2.1 This Agreement shall commence on {{START_DATE}} and continue until {{END_DATE}} unless earlier terminated.

2.2 This Agreement may be renewed by mutual written agreement.

3. FEES AND PAYMENT
3.1 The Client shall pay the Service Provider a fee of ₦{{SERVICE_FEE}} (Naira {{FEE_WORDS}}).

3.2 Payment shall be made as follows:
{{PAYMENT_TERMS}}

3.3 All fees are exclusive of applicable taxes which shall be borne by the Client.

4. INTELLECTUAL PROPERTY
4.1 All work product created by the Service Provider shall belong to {{IP_OWNER}}.

4.2 The Service Provider grants the Client a {{LICENSE_TYPE}} license to use any pre-existing materials.

5. WARRANTIES
5.1 The Service Provider warrants that services will be performed in a professional manner.

5.2 The Service Provider warrants that they have the necessary expertise and qualifications.

6. LIMITATION OF LIABILITY
The Service Provider's total liability shall not exceed the total fees paid under this Agreement.

7. CONFIDENTIALITY
Both parties agree to keep confidential all information disclosed during the course of this Agreement.

8. TERMINATION
8.1 Either party may terminate this Agreement by giving {{NOTICE_PERIOD}} days written notice.

8.2 Either party may terminate immediately for material breach.

9. GOVERNING LAW
This Agreement shall be governed by the laws of Nigeria.

IN WITNESS WHEREOF the parties have executed this Agreement.

_________________________                    _________________________
SERVICE PROVIDER                                CLIENT
{{SERVICE_PROVIDER_NAME}}                       {{CLIENT_NAME}}

Signed: _________________________           Signed: _________________________
Name: {{PROVIDER_SIGNATORY}}                  Name: {{CLIENT_SIGNATORY}}
Title: {{PROVIDER_TITLE}}                     Title: {{CLIENT_TITLE}}
Date: {{EXECUTION_DATE}}                      Date: {{EXECUTION_DATE}}
`,
    placeholders: [
      { key: "SERVICE_PROVIDER_NAME", label: "Service Provider Name", type: "text", required: true, hint: "Name of the service provider company/individual" },
      { key: "SERVICE_PROVIDER_ADDRESS", label: "Service Provider Address", type: "textarea", required: true, hint: "Address of service provider" },
      { key: "CLIENT_NAME", label: "Client Name", type: "text", required: true, hint: "Name of the client" },
      { key: "CLIENT_ADDRESS", label: "Client Address", type: "textarea", required: true, hint: "Address of client" },
      { key: "SERVICE_DESCRIPTION", label: "Service Description", type: "text", required: true, hint: "Brief description of services" },
      { key: "EFFECTIVE_DATE", label: "Effective Date", type: "date", required: true, hint: "Date when agreement starts" },
      { key: "YEAR", label: "Year", type: "text", required: true, hint: "Current year" },
      { key: "SCOPE_OF_SERVICES", label: "Scope of Services", type: "textarea", required: true, hint: "Detailed description of services to be provided" },
      { key: "START_DATE", label: "Start Date", type: "date", required: true, hint: "Start date of services" },
      { key: "END_DATE", label: "End Date", type: "date", required: true, hint: "End date of services" },
      { key: "SERVICE_FEE", label: "Service Fee", type: "currency", required: true, hint: "Total fee for services" },
      { key: "FEE_WORDS", label: "Fee in Words", type: "text", required: true, hint: "Fee written in words" },
      { key: "PAYMENT_TERMS", label: "Payment Terms", type: "textarea", required: true, hint: "Schedule and terms of payment" },
      { key: "IP_OWNER", label: "Intellectual Property Owner", type: "select", required: true, options: ["the Client", "the Service Provider"], hint: "Who owns the IP created" },
      { key: "LICENSE_TYPE", label: "License Type", type: "select", required: true, options: ["exclusive", "non-exclusive", "perpetual"], hint: "Type of license granted" },
      { key: "NOTICE_PERIOD", label: "Notice Period (Days)", type: "number", required: true, defaultValue: "30", hint: "Days of notice for termination" },
      { key: "PROVIDER_SIGNATORY", label: "Service Provider Signatory", type: "text", required: true, hint: "Name of signatory for service provider" },
      { key: "CLIENT_SIGNATORY", label: "Client Signatory", type: "text", required: true, hint: "Name of signatory for client" },
      { key: "PROVIDER_TITLE", label: "Provider Signatory Title", type: "text", required: true, hint: "Designation of provider's signatory" },
      { key: "CLIENT_TITLE", label: "Client Signatory Title", type: "text", required: true, hint: "Designation of client's signatory" },
      { key: "EXECUTION_DATE", label: "Execution Date", type: "date", required: true, hint: "Date of signing" }
    ],
    tags: ["service", "agreement", "professional", "Nigeria"],
    governingLaw: "Laws of Nigeria",
    status: "active",
    isFeatured: false,
  },
  {
    title: "Memorandum of Understanding (MOU)",
    description:
      "Framework agreement for establishing business relationships in Nigeria with dispute resolution clauses.",
    category: "contract",
    subcategory: "mou",
    practiceArea: "corporate-commercial",
    isSystemTemplate: true,
    content: `MEMORANDUM OF UNDERSTANDING

This Memorandum of Understanding ("MOU") is entered into this {{EFFECTIVE_DATE}} day of {{YEAR}}

BETWEEN:

{{PARTY_A_NAME}} (hereinafter referred to as "Party A")
AND
{{PARTY_B_NAME}} (hereinafter referred to as "Party B")

(Party A and Party B are collectively referred to as "the Parties")

WHEREAS:
The Parties are interested in exploring a potential collaboration in relation to {{PURPOSE}} and wish to set out the terms upon which they intend to proceed.

NOW IT IS HEREBY AGREED as follows:

1. PURPOSE
This MOU sets forth the framework for cooperation between the Parties regarding {{PURPOSE}}.

2. AREAS OF COOPERATION
The Parties intend to cooperate in the following areas:
{{AREAS_OF_COOPERATION}}

3. RESPONSIBILITIES
3.1 Party A shall:
{{PARTY_A_RESPONSIBILITIES}}

3.2 Party B shall:
{{PARTY_B_RESPONSIBILITIES}}

4. FUNDING
Each Party shall bear its own costs incurred in connection with this MOU unless otherwise agreed in writing.

5. NON-BINDING NATURE
5.1 This MOU is a statement of intent and does not create any legally binding obligations between the Parties.

5.2 Any binding agreement shall be set out in a separate definitive agreement to be negotiated in good faith.

6. DURATION
6.1 This MOU shall remain in effect for {{TERM_MONTHS}} months from the Effective Date.

6.2 Either Party may withdraw by giving {{NOTICE_PERIOD}} days written notice.

7. CONFIDENTIALITY
The Parties agree to treat all information exchanged under this MOU as confidential.

8. DISPUTE RESOLUTION
8.1 Any dispute arising from this MOU shall first be referred to senior management of both Parties for resolution through negotiation.

8.2 If negotiation fails, the dispute shall be referred to mediation in accordance with the Lagos State Mediation Centre Rules.

8.3 If mediation fails, the dispute shall be referred to arbitration in Nigeria under the Arbitration and Conciliation Act Cap A18 LFN 2004.

9. GOVERNING LAW
This MOU shall be governed by the laws of the Federal Republic of Nigeria.

IN WITNESS WHEREOF the Parties have executed this MOU.

_________________________                    _________________________
PARTY A                                         PARTY B
{{PARTY_A_NAME}}                                {{PARTY_B_NAME}}

Authorized Signature: ________________      Authorized Signature: ________________
Name: {{PARTY_A_SIGNATORY}}                   Name: {{PARTY_B_SIGNATORY}}
Title: {{PARTY_A_TITLE}}                      Title: {{PARTY_B_TITLE}}
Date: {{EXECUTION_DATE}}                       Date: {{EXECUTION_DATE}}
`,
    placeholders: [
      { key: "PARTY_A_NAME", label: "Party A Name", type: "text", required: true, hint: "Name of the first party" },
      { key: "PARTY_B_NAME", label: "Party B Name", type: "text", required: true, hint: "Name of the second party" },
      { key: "PURPOSE", label: "Purpose of MOU", type: "textarea", required: true, hint: "Purpose of the collaboration" },
      { key: "EFFECTIVE_DATE", label: "Effective Date", type: "date", required: true, hint: "Date when MOU becomes effective" },
      { key: "YEAR", label: "Year", type: "text", required: true, hint: "Current year" },
      { key: "AREAS_OF_COOPERATION", label: "Areas of Cooperation", type: "textarea", required: true, hint: "Specific areas of cooperation" },
      { key: "PARTY_A_RESPONSIBILITIES", label: "Party A Responsibilities", type: "textarea", required: true, hint: "Responsibilities of Party A" },
      { key: "PARTY_B_RESPONSIBILITIES", label: "Party B Responsibilities", type: "textarea", required: true, hint: "Responsibilities of Party B" },
      { key: "TERM_MONTHS", label: "Term (Months)", type: "number", required: true, defaultValue: "12", hint: "Duration in months" },
      { key: "NOTICE_PERIOD", label: "Notice Period (Days)", type: "number", required: true, defaultValue: "30", hint: "Days of notice for withdrawal" },
      { key: "PARTY_A_SIGNATORY", label: "Party A Signatory", type: "text", required: true, hint: "Name of authorized signatory" },
      { key: "PARTY_B_SIGNATORY", label: "Party B Signatory", type: "text", required: true, hint: "Name of authorized signatory" },
      { key: "PARTY_A_TITLE", label: "Party A Title", type: "text", required: true, hint: "Designation of signatory" },
      { key: "PARTY_B_TITLE", label: "Party B Title", type: "text", required: true, hint: "Designation of signatory" },
      { key: "EXECUTION_DATE", label: "Execution Date", type: "date", required: true, hint: "Date of signing" }
    ],
    tags: ["mou", "memorandum", "understanding", "collaboration", "Nigeria"],
    governingLaw: "Laws of Nigeria",
    status: "active",
    isFeatured: false,
  },
  {
    title: "Retainer Agreement (Law Firm)",
    description:
      "Legal retainer agreement for law firms in Nigeria, compliant with LPDC requirements.",
    category: "contract",
    subcategory: "retainer",
    practiceArea: "general",
    isSystemTemplate: true,
    content: `RETAINER AGREEMENT

This Retainer Agreement ("Agreement") is made this {{EFFECTIVE_DATE}} day of {{YEAR}}

BETWEEN:

{{FIRM_NAME}} of {{FIRM_ADDRESS}} (hereinafter called "the Firm")

AND

{{CLIENT_NAME}} of {{CLIENT_ADDRESS}} (hereinafter called "the Client")

WHEREAS:
The Firm is a firm of legal practitioners duly registered under the Laws of Nigeria and the Client desires to retain the Firm to provide legal services.

NOW IT IS HEREBY AGREED:

1. SCOPE OF RETAINER
1.1 The Client hereby retains the Firm to provide the following legal services:
{{SCOPE_OF_SERVICES}}

1.2 Services outside the above scope shall be billed separately at the Firm's prevailing rates.

2. RETAINER FEE
2.1 The Client shall pay a retainer fee of ₦{{RETAINER_FEE}} (Naira {{FEE_WORDS}}) per {{RETAINER_PERIOD}}.

2.2 The retainer fee covers:
{{RETAINER_COVERS}}

3. BILLING RATES
The Firm's billing rates are as follows:
- Senior Partner: ₦{{SENIOR_RATE}} per hour
- Partner: ₦{{PARTNER_RATE}} per hour
- Associate: ₦{{ASSOCIATE_RATE}} per hour
- Solicitor: ₦{{SOLICITOR_RATE}} per hour

4. PAYMENT TERMS
4.1 The retainer fee is payable in advance on or before the {{PAYMENT_DAY}} of each {{PAYMENT_PERIOD}}.

4.2 Invoices for out-of-pocket expenses are payable within {{INVOICE_DAYS}} days of receipt.

4.3 All fees are subject to applicable taxes.

5. FILE HANDLING
5.1 The Firm shall maintain proper files and records of all matters handled.

5.2 Upon termination, all original documents shall be returned to the Client.

5.3 The Firm may retain copies for record purposes.

6. CONFIDENTIALITY
The Firm shall maintain strict confidentiality of all Client information.

7. CONFLICT OF INTEREST
The Firm shall immediately notify the Client of any potential conflict of interest.

8. TERMINATION
8.1 Either party may terminate this Agreement by giving {{NOTICE_PERIOD}} days written notice.

8.2 Upon termination, the Client shall pay for all services rendered up to the termination. PROFESSIONAL INDEMNITY
The date.

9 Firm maintains Professional Indemnity Insurance as required by the Legal Practitioners (Professional Indemnity) Rules.

10. LPDC COMPLIANCE
This Agreement is subject to the Rules of Professional Conduct for Legal Practitioners 2024 and the directives of the Legal Practitioners Disciplinary Committee (LPDC).

11. GOVERNING LAW
This Agreement shall be governed by the laws of Nigeria.

IN WITNESS WHEREOF the parties have executed this Agreement.

_________________________                    _________________________
THE FIRM                                        THE CLIENT
{{FIRM_NAME}}                                   {{CLIENT_NAME}}

Signed: _________________________           Signed: _________________________
Name: {{PARTNER_NAME}}                        Name: {{CLIENT_SIGNATORY}}
Title: Managing Partner                        Title: {{CLIENT_TITLE}}
Date: {{EXECUTION_DATE}}                       Date: {{EXECUTION_DATE}}
`,
    placeholders: [
      { key: "FIRM_NAME", label: "Law Firm Name", type: "text", required: true, hint: "Name of the law firm" },
      { key: "FIRM_ADDRESS", label: "Law Firm Address", type: "textarea", required: true, hint: "Registered address of the firm" },
      { key: "CLIENT_NAME", label: "Client Name", type: "text", required: true, hint: "Name of the client" },
      { key: "CLIENT_ADDRESS", label: "Client Address", type: "textarea", required: true, hint: "Address of the client" },
      { key: "EFFECTIVE_DATE", label: "Effective Date", type: "date", required: true, hint: "Date when retainer starts" },
      { key: "YEAR", label: "Year", type: "text", required: true, hint: "Current year" },
      { key: "SCOPE_OF_SERVICES", label: "Scope of Services", type: "textarea", required: true, hint: "Description of legal services covered" },
      { key: "RETAINER_FEE", label: "Retainer Fee", type: "currency", required: true, hint: "Amount of retainer fee" },
      { key: "FEE_WORDS", label: "Fee in Words", type: "text", required: true, hint: "Fee written in words" },
      { key: "RETAINER_PERIOD", label: "Retainer Period", type: "select", required: true, options: ["month", "quarter", "year"], hint: "How often retainer is paid" },
      { key: "RETAINER_COVERS", label: "What Retainer Covers", type: "textarea", required: true, hint: "List of what's included in retainer" },
      { key: "SENIOR_RATE", label: "Senior Partner Rate", type: "currency", required: true, hint: "Hourly rate" },
      { key: "PARTNER_RATE", label: "Partner Rate", type: "currency", required: true, hint: "Hourly rate" },
      { key: "ASSOCIATE_RATE", label: "Associate Rate", type: "currency", required: true, hint: "Hourly rate" },
      { key: "SOLICITOR_RATE", label: "Solicitor Rate", type: "currency", required: true, hint: "Hourly rate" },
      { key: "PAYMENT_DAY", label: "Payment Day", type: "number", required: true, hint: "Day of period for payment" },
      { key: "PAYMENT_PERIOD", label: "Payment Period", type: "select", required: true, options: ["month", "quarter", "year"], hint: "Payment frequency" },
      { key: "INVOICE_DAYS", label: "Invoice Payment Days", type: "number", required: true, defaultValue: "14", hint: "Days to pay invoices" },
      { key: "NOTICE_PERIOD", label: "Notice Period (Days)", type: "number", required: true, defaultValue: "30", hint: "Days of notice for termination" },
      { key: "PARTNER_NAME", label: "Managing Partner Name", type: "text", required: true, hint: "Name of managing partner" },
      { key: "CLIENT_SIGNATORY", label: "Client Signatory", type: "text", required: true, hint: "Name of client signatory" },
      { key: "CLIENT_TITLE", label: "Client Title", type: "text", required: true, hint: "Designation of client signatory" },
      { key: "EXECUTION_DATE", label: "Execution Date", type: "date", required: true, hint: "Date of signing" }
    ],
    tags: ["retainer", "law firm", "legal services", "Nigeria"],
    governingLaw: "Rules of Professional Conduct for Legal Practitioners 2024",
    status: "active",
    isFeatured: true,
  },
  {
    title: "Writ of Summons (Nigerian High Court)",
    description:
      "Standard Writ of Summons for commencement of civil action in Nigerian High Court.",
    category: "court-process",
    subcategory: "originating-process",
    practiceArea: "litigation",
    isSystemTemplate: true,
    content: `IN THE {{COURT_NAME}}

SUIT NO: {{SUIT_NUMBER}}

BETWEEN:

{{PLAINTIFF_NAME}}                                                    PLAINTIFF

AND

{{DEFENDANT_NAME}}                                                    DEFENDANT

WRIT OF SUMMONS

To: {{DEFENDANT_NAME}}
Of: {{DEFENDANT_ADDRESS}}

TAKE NOTICE that this Honourable Court has been moved by {{LAWYER_NAME}} of {{FIRM_NAME}} holding the brief of {{SENIOR_LAWYER}} & Co. appearing for the Plaintiff and upon reading the Affidavit and Written Address of {{AFFIDAVIT_NAME}} filed herein, this Honourable Court has been pleased to order that you do within {{APPEARANCE_DAYS}} days after the service of this Writ upon you inclusive of the day of such service, do cause an Appearance to be entered for you in this action, otherwise judgment may be entered against you in default.

The Plaintiff's claim against you is for:
{{CLAIM_DESCRIPTION}}

And the following reliefs are sought:
{{RELIEFS_SOUGHT}}

Given under the seal of this Honourable Court this {{FILING_DATE}} day of {{FILING_YEAR}}.

_________________________
{{REGISTAR_NAME}}
{{COURT_TITLE}}
{{COURT_NAME}}

This Writ was filed by {{FIRM_NAME}}, {{FIRM_ADDRESS}}, Solicitors to the above-named Plaintiff.

SERVICE:
This Writ of Summons is to be served on the Defendant personally or by Registered Post.

NOTE: If you fail to enter Appearance within the time stated, judgment may be given against you.
`,
    placeholders: [
      { key: "COURT_NAME", label: "Court Name", type: "select", required: true, options: ["High Court of Lagos State", "High Court of the Federal Capital Territory", "High Court of Rivers State", "High Court of Kano State", "High Court of Oyo State", "Federal High Court"], hint: "Select the court where this matter is being heard" },
      { key: "SUIT_NUMBER", label: "Suit Number", type: "text", required: true, hint: "Leave blank if not yet assigned" },
      { key: "PLAINTIFF_NAME", label: "Plaintiff Full Name", type: "text", required: true, hint: "Full legal name of the plaintiff" },
      { key: "PLAINTIFF_ADDRESS", label: "Plaintiff Address", type: "textarea", required: true, hint: "Address of the plaintiff" },
      { key: "DEFENDANT_NAME", label: "Defendant Full Name", type: "text", required: true, hint: "Full legal name of the defendant" },
      { key: "DEFENDANT_ADDRESS", label: "Defendant Address", type: "textarea", required: true, hint: "Address of the defendant" },
      { key: "LAWYER_NAME", label: "Lawyer's Full Name", type: "text", required: true, hint: "Name of filing lawyer" },
      { key: "FIRM_NAME", label: "Law Firm Name", type: "text", required: true, hint: "Name of the law firm" },
      { key: "FIRM_ADDRESS", label: "Law Firm Address", type: "textarea", required: true, hint: "Address of the law firm" },
      { key: "SENIOR_LAWYER", label: "Senior Lawyer Name", type: "text", required: true, hint: "Name of senior lawyer" },
      { key: "AFFIDAVIT_NAME", label: "Affidavit Deponent Name", type: "text", required: true, hint: "Name of person who swore the affidavit" },
      { key: "APPEARANCE_DAYS", label: "Days to Enter Appearance", type: "number", required: true, defaultValue: "42", hint: "Number of days to enter appearance" },
      { key: "CLAIM_DESCRIPTION", label: "Nature of Claim", type: "textarea", required: true, hint: "Brief description of the claim" },
      { key: "RELIEFS_SOUGHT", label: "Reliefs Sought", type: "textarea", required: true, hint: "List each relief on a separate line" },
      { key: "FILING_DATE", label: "Date of Filing", type: "date", required: true, hint: "Date when filed" },
      { key: "FILING_YEAR", label: "Filing Year", type: "text", required: true, hint: "Year of filing" },
      { key: "REGISTAR_NAME", label: "Registrar Name", type: "text", required: true, hint: "Name of the Registrar" },
      { key: "COURT_TITLE", label: "Court Title", type: "text", required: true, hint: "Title of the Registrar" }
    ],
    courtDetails: {
      applicableCourts: ["High Court of Lagos State", "High Court of FCT", "Federal High Court", "High Court of Rivers State", "High Court of Kano State"],
      documentType: "originating-process",
      jurisdiction: "both",
    },
    tags: ["writ", "summons", "court", "litigation", "Nigeria"],
    governingLaw: "High Court Civil Procedure Rules",
    status: "active",
    isFeatured: true,
  },
  {
    title: "Statement of Claim",
    description:
      "Statement of Claim pleading for civil litigation in Nigerian courts.",
    category: "court-process",
    subcategory: "pleading",
    practiceArea: "litigation",
    isSystemTemplate: true,
    content: `IN THE {{COURT_NAME}}

SUIT NO: {{SUIT_NUMBER}}

BETWEEN:

{{PLAINTIFF_NAME}}                                                    PLAINTIFF

AND

{{DEFENDANT_NAME}}                                                    DEFENDANT

STATEMENT OF CLAIM

Filed on behalf of the Plaintiff

{{PARAGRAPHS}}

PARTICULARS OF CLAIM:
{{PARTICULARS}}

RELIEFS SOUGHT:
{{RELIEFS}}

The Plaintiff claims against the Defendant as set out above.

Dated this {{FILING_DATE}} day of {{FILING_YEAR}}.

_________________________
{{LAWYER_NAME}}
{{BAR_NUMBER}}
{{FIRM_NAME}}
{{FIRM_ADDRESS}}
Counsel to the Plaintiff
`,
    placeholders: [
      { key: "COURT_NAME", label: "Court Name", type: "select", required: true, options: ["High Court of Lagos State", "High Court of the Federal Capital Territory", "High Court of Rivers State", "High Court of Kano State", "Federal High Court"] },
      { key: "SUIT_NUMBER", label: "Suit Number", type: "text", required: true },
      { key: "PLAINTIFF_NAME", label: "Plaintiff Name", type: "text", required: true },
      { key: "DEFENDANT_NAME", label: "Defendant Name", type: "text", required: true },
      { key: "PARAGRAPHS", label: "Statement of Facts", type: "textarea", required: true, hint: "Numbered paragraphs of facts" },
      { key: "PARTICULARS", label: "Particulars of Claim", type: "textarea", required: true, hint: "Specific particulars" },
      { key: "RELIEFS", label: "Reliefs Sought", type: "textarea", required: true, hint: "List of reliefs" },
      { key: "FILING_DATE", label: "Filing Date", type: "date", required: true },
      { key: "FILING_YEAR", label: "Filing Year", type: "text", required: true },
      { key: "LAWYER_NAME", label: "Lawyer Name", type: "text", required: true },
      { key: "BAR_NUMBER", label: "Bar Number", type: "text", required: true },
      { key: "FIRM_NAME", label: "Firm Name", type: "text", required: true },
      { key: "FIRM_ADDRESS", label: "Firm Address", type: "textarea", required: true }
    ],
    courtDetails: {
      applicableCourts: ["High Court of Lagos State", "High Court of FCT", "Federal High Court"],
      documentType: "originating-process",
      jurisdiction: "both",
    },
    tags: ["statement of claim", "pleading", "litigation", "Nigeria"],
    governingLaw: "High Court Civil Procedure Rules",
    status: "active",
    isFeatured: true,
  },
  {
    title: "Statement of Defence",
    description:
      "Statement of Defence pleading for responding to claims in Nigerian courts.",
    category: "court-process",
    subcategory: "pleading",
    practiceArea: "litigation",
    isSystemTemplate: true,
    content: `IN THE {{COURT_NAME}}

SUIT NO: {{SUIT_NUMBER}}

BETWEEN:

{{PLAINTIFF_NAME}}                                                    PLAINTIFF

AND

{{DEFENDANT_NAME}}                                                    DEFENDANT

STATEMENT OF DEFENCE

Filed on behalf of the Defendant

1. {{DEFENDANT_NAME}} admits the allegations contained in paragraphs {{ADMITTED_PARAGRAPHS}} of the Statement of Claim.

2. {{DEFENDANT_NAME}} denies the allegations contained in paragraphs {{DENIED_PARAGRAPHS}} of the Statement of Claim and puts the Plaintiff to the strict proof thereof.

3. {{ADDITIONAL_DEFENCE}}

PARTICULARS OF DEFENCE:
{{PARTICULARS}}

COUNTERCLAIM (if any):
{{COUNTERCLAIM}}

WHEREFORE the Defendant prays that:
{{DEFENDANT_PRAYER}}

Dated this {{FILING_DATE}} day of {{FILING_YEAR}}.

_________________________
{{LAWYER_NAME}}
{{BAR_NUMBER}}
{{FIRM_NAME}}
{{FIRM_ADDRESS}}
Counsel to the Defendant
`,
    placeholders: [
      { key: "COURT_NAME", label: "Court Name", type: "select", required: true, options: ["High Court of Lagos State", "High Court of the Federal Capital Territory", "High Court of Rivers State", "Federal High Court"] },
      { key: "SUIT_NUMBER", label: "Suit Number", type: "text", required: true },
      { key: "PLAINTIFF_NAME", label: "Plaintiff Name", type: "text", required: true },
      { key: "DEFENDANT_NAME", label: "Defendant Name", type: "text", required: true },
      { key: "ADMITTED_PARAGRAPHS", label: "Admitted Paragraphs", type: "text", required: false, hint: "Paragraph numbers admitted" },
      { key: "DENIED_PARAGRAPHS", label: "Denied Paragraphs", type: "text", required: true, hint: "Paragraph numbers denied" },
      { key: "ADDITIONAL_DEFENCE", label: "Additional Defence", type: "textarea", required: false, hint: "Positive defence" },
      { key: "PARTICULARS", label: "Particulars of Defence", type: "textarea", required: true },
      { key: "COUNTERCLAIM", label: "Counterclaim", type: "textarea", required: false },
      { key: "DEFENDANT_PRAYER", label: "Defendant's Prayer", type: "textarea", required: true },
      { key: "FILING_DATE", label: "Filing Date", type: "date", required: true },
      { key: "FILING_YEAR", label: "Filing Year", type: "text", required: true },
      { key: "LAWYER_NAME", label: "Lawyer Name", type: "text", required: true },
      { key: "BAR_NUMBER", label: "Bar Number", type: "text", required: true },
      { key: "FIRM_NAME", label: "Firm Name", type: "text", required: true },
      { key: "FIRM_ADDRESS", label: "Firm Address", type: "textarea", required: true }
    ],
    courtDetails: {
      applicableCourts: ["High Court of Lagos State", "High Court of FCT", "Federal High Court"],
      documentType: "originating-process",
      jurisdiction: "both",
    },
    tags: ["defence", "pleading", "litigation", "Nigeria"],
    governingLaw: "High Court Civil Procedure Rules",
    status: "active",
    isFeatured: false,
  },
  {
    title: "Motion on Notice",
    description:
      "Interlocutory application (Motion on Notice) for Nigerian courts.",
    category: "court-process",
    subcategory: "interlocutory",
    practiceArea: "litigation",
    isSystemTemplate: true,
    content: `IN THE {{COURT_NAME}}

SUIT NO: {{SUIT_NUMBER}}

BETWEEN:

{{PLAINTIFF_NAME}}                                                    PLAINTIFF

AND

{{DEFENDANT_NAME}}                                                    DEFENDANT

MOTION ON NOTICE

Take Notice that this Honourable Court will be moved on the {{HEARING_DATE}} day of {{HEARING_YEAR}} at the hour of {{HEARING_TIME}} or so soon thereafter as the Applicant or Counsel on behalf of the Applicant may be heard, praying this Honourable Court for the following reliefs:

{{RELIEFS_SOUGHT}}

GROUNDS FOR THIS APPLICATION:
{{GROUNDS}}

Dated this {{FILING_DATE}} day of {{FILING_YEAR}}.

_________________________
{{LAWYER_NAME}}
{{BAR_NUMBER}}
{{FIRM_NAME}}
{{FIRM_ADDRESS}}
Counsel to the Applicant

SERVED on the {{OTHER_PARTY_NAME}}
of {{OTHER_PARTY_ADDRESS}}
this {{SERVICE_DATE}} day of {{SERVICE_YEAR}}.
`,
    placeholders: [
      { key: "COURT_NAME", label: "Court Name", type: "select", required: true, options: ["High Court of Lagos State", "High Court of the Federal Capital Territory", "High Court of Rivers State", "Court of Appeal", "Federal High Court"] },
      { key: "SUIT_NUMBER", label: "Suit Number", type: "text", required: true },
      { key: "PLAINTIFF_NAME", label: "Plaintiff Name", type: "text", required: true },
      { key: "DEFENDANT_NAME", label: "Defendant Name", type: "text", required: true },
      { key: "HEARING_DATE", label: "Hearing Date", type: "date", required: true },
      { key: "HEARING_YEAR", label: "Hearing Year", type: "text", required: true },
      { key: "HEARING_TIME", label: "Hearing Time", type: "text", required: true, defaultValue: "9 o'clock in the forenoon" },
      { key: "RELIEFS_SOUGHT", label: "Reliefs Sought", type: "textarea", required: true },
      { key: "GROUNDS", label: "Grounds", type: "textarea", required: true },
      { key: "FILING_DATE", label: "Filing Date", type: "date", required: true },
      { key: "FILING_YEAR", label: "Filing Year", type: "text", required: true },
      { key: "LAWYER_NAME", label: "Lawyer Name", type: "text", required: true },
      { key: "BAR_NUMBER", label: "Bar Number", type: "text", required: true },
      { key: "FIRM_NAME", label: "Firm Name", type: "text", required: true },
      { key: "FIRM_ADDRESS", label: "Firm Address", type: "textarea", required: true },
      { key: "OTHER_PARTY_NAME", label: "Other Party Name", type: "text", required: true },
      { key: "OTHER_PARTY_ADDRESS", label: "Other Party Address", type: "textarea", required: true },
      { key: "SERVICE_DATE", label: "Service Date", type: "date", required: true },
      { key: "SERVICE_YEAR", label: "Service Year", type: "text", required: true }
    ],
    courtDetails: {
      applicableCourts: ["High Court of Lagos State", "High Court of FCT", "Federal High Court", "Court of Appeal"],
      documentType: "interlocutory",
      jurisdiction: "both",
    },
    tags: ["motion", "interlocutory", "application", "Nigeria"],
    governingLaw: "High Court Civil Procedure Rules",
    status: "active",
    isFeatured: false,
  },
  {
    title: "Affidavit in Support",
    description:
      "Standard affidavit format for Nigerian court proceedings.",
    category: "court-process",
    subcategory: "affidavit",
    practiceArea: "litigation",
    isSystemTemplate: true,
    content: `IN THE {{COURT_NAME}}

SUIT NO: {{SUIT_NUMBER}}

BETWEEN:

{{PLAINTIFF_NAME}}                                                    PLAINTIFF

AND

{{DEFENDANT_NAME}}                                                    DEFENDANT

AFFIDAVIT IN SUPPORT

I, {{DEPONENT_NAME}}, of {{DEPONENT_ADDRESS}}, a {{DEPONENT_OCCUPATION}} Nigerian, do hereby make oath and state as follows:

1. That I am the {{RELATIONSHIP}} of the {{PARTY_TYPE}} in this suit.

2. That I have the authority to depose to this affidavit on behalf of the {{PARTY_TYPE}}.

3. That I am familiar with the facts of this case and have good knowledge of the matters deposed to herein.

4. That the statements contained in paragraphs {{STATED_PARAGRAPHS}} of the {{DOCUMENT_TYPE}} filed in this suit are true and correct to the best of my knowledge, information, and belief.

5. That I depose to this affidavit in good faith, believing the contents to be true and correct.

{{ADDITIONAL_STATEMENTS}}

DEPONENT

Sworn to at the High Court Registry, {{COURT_LOCATION}}
This {{SWORN_DATE}} day of {{SWORN_YEAR}}

Before me:

_________________________
Commissioner for Oaths / Notary Public
Name: {{COMMISSIONER_NAME}}
{{COMMISSIONER_TITLE}}
`,
    placeholders: [
      { key: "COURT_NAME", label: "Court Name", type: "select", required: true, options: ["High Court of Lagos State", "High Court of the Federal Capital Territory", "High Court of Rivers State", "Federal High Court", "Court of Appeal"] },
      { key: "SUIT_NUMBER", label: "Suit Number", type: "text", required: true },
      { key: "PLAINTIFF_NAME", label: "Plaintiff Name", type: "text", required: true },
      { key: "DEFENDANT_NAME", label: "Defendant Name", type: "text", required: true },
      { key: "DEPONENT_NAME", label: "Deponent Full Name", type: "text", required: true },
      { key: "DEPONENT_ADDRESS", label: "Deponent Address", type: "textarea", required: true },
      { key: "DEPONENT_OCCUPATION", label: "Deponent Occupation", type: "text", required: true },
      { key: "RELATIONSHIP", label: "Relationship to Party", type: "text", required: true },
      { key: "PARTY_TYPE", label: "Party Type", type: "select", required: true, options: ["Plaintiff", "Defendant", "Applicant", "Respondent"] },
      { key: "STATED_PARAGRAPHS", label: "Paragraph Numbers", type: "text", required: true },
      { key: "DOCUMENT_TYPE", label: "Document Type", type: "text", required: true, hint: "e.g., Statement of Claim, Motion" },
      { key: "ADDITIONAL_STATEMENTS", label: "Additional Statements", type: "textarea", required: false },
      { key: "COURT_LOCATION", label: "Court Location", type: "text", required: true },
      { key: "SWORN_DATE", label: "Sworn Date", type: "date", required: true },
      { key: "SWORN_YEAR", label: "Sworn Year", type: "text", required: true },
      { key: "COMMISSIONER_NAME", label: "Commissioner Name", type: "text", required: true },
      { key: "COMMISSIONER_TITLE", label: "Commissioner Title", type: "text", required: true }
    ],
    courtDetails: {
      applicableCourts: ["High Court of Lagos State", "High Court of FCT", "Federal High Court", "Court of Appeal", "Magistrate Court"],
      documentType: "originating-process",
      jurisdiction: "both",
    },
    tags: ["affidavit", "oath", "evidence", "Nigeria"],
    governingLaw: "Evidence Act 2011",
    status: "active",
    isFeatured: false,
  },
  {
    title: "Notice of Appeal (Court of Appeal)",
    description:
      "Notice of Appeal for appealing judgments to the Court of Appeal Nigeria.",
    category: "court-process",
    subcategory: "appeal",
    practiceArea: "litigation",
    isSystemTemplate: true,
    content: `IN THE COURT OF APPEAL
HOLDEN AT {{COURT_LOCATION}}

Appeal No: {{APPEAL_NUMBER}}

BETWEEN:

{{APPELLANT_NAME}}                                                    APPELLANT

AND

{{RESPONDENT_NAME}}                                                   RESPONDENT

NOTICE OF APPEAL

TAKE NOTICE that the Appellant being dissatisfied with the Judgment/Ruling of the {{LOWER_COURT}} delivered on the {{JUDGMENT_DATE}} day of {{JUDGMENT_YEAR}} by {{JUDGE_NAME}}, hereby appeals to this Honourable Court against the said Judgment/Ruling.

GROUNDS OF APPEAL:
{{GROUNDS_OF_APPEAL}}

The Appellant seeks the following reliefs:
{{RELIEFS_SOUGHT}}

This Notice of Appeal is filed pursuant to the Court of Appeal Rules 2021.

Dated this {{FILING_DATE}} day of {{FILING_YEAR}}.

_________________________
{{LAWYER_NAME}}
{{BAR_NUMBER}}
{{FIRM_NAME}}
{{FIRM_ADDRESS}}
Counsel to the Appellant

FILED by: {{FIRM_NAME}}
Address: {{FIRM_ADDRESS}}
`,
    placeholders: [
      { key: "COURT_LOCATION", label: "Court Location", type: "select", required: true, options: ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Enugu", "Calabar", "Benin", "Akure", "Owerri"], hint: "Location of the Court of Appeal" },
      { key: "APPEAL_NUMBER", label: "Appeal Number", type: "text", required: true },
      { key: "APPELLANT_NAME", label: "Appellant Name", type: "text", required: true },
      { key: "RESPONDENT_NAME", label: "Respondent Name", type: "text", required: true },
      { key: "LOWER_COURT", label: "Lower Court Name", type: "text", required: true, hint: "Name of the court whose judgment is being appealed" },
      { key: "JUDGMENT_DATE", label: "Judgment Date", type: "date", required: true },
      { key: "JUDGMENT_YEAR", label: "Judgment Year", type: "text", required: true },
      { key: "JUDGE_NAME", label: "Judge Name", type: "text", required: true },
      { key: "GROUNDS_OF_APPEAL", label: "Grounds of Appeal", type: "textarea", required: true },
      { key: "RELIEFS_SOUGHT", label: "Reliefs Sought", type: "textarea", required: true },
      { key: "FILING_DATE", label: "Filing Date", type: "date", required: true },
      { key: "FILING_YEAR", label: "Filing Year", type: "text", required: true },
      { key: "LAWYER_NAME", label: "Lawyer Name", type: "text", required: true },
      { key: "BAR_NUMBER", label: "Bar Number", type: "text", required: true },
      { key: "FIRM_NAME", label: "Firm Name", type: "text", required: true },
      { key: "FIRM_ADDRESS", label: "Firm Address", type: "textarea", required: true }
    ],
    courtDetails: {
      applicableCourts: ["Court of Appeal"],
      documentType: "originating-process",
      jurisdiction: "federal",
    },
    tags: ["appeal", "notice", "court of appeal", "Nigeria"],
    governingLaw: "Court of Appeal Rules 2021",
    status: "active",
    isFeatured: true,
  },
  {
    title: "Written Address (Final Written Address)",
    description:
      "Final written address/brief for Nigerian courts presenting legal arguments.",
    category: "court-process",
    subcategory: "written-address",
    practiceArea: "litigation",
    isSystemTemplate: true,
    content: `IN THE {{COURT_NAME}}

SUIT NO: {{SUIT_NUMBER}}

BETWEEN:

{{PLAINTIFF_NAME}}                                                    PLAINTIFF

AND

{{DEFENDANT_NAME}}                                                    DEFENDANT

WRITTEN ADDRESS IN SUPPORT OF {{APPLICATION_TYPE}}

Filed on behalf of the {{FILING_PARTY}}

ISSUES FOR DETERMINATION:
{{ISSUES}}

ARGUMENT:

ISSUE 1: {{ISSUE_1_ARGUMENT}}

By the case of {{CASE_1}}, it was held that:
{{CASE_1_HOLDING}}

Similarly, in {{CASE_2}}, the court stated:
{{CASE_2_HOLDING}}

ISSUE 2: {{ISSUE_2_ARGUMENT}}

CONCLUSION:
{{CONCLUSION}}

WHEREFORE it is humbly prayed that this Honourable Court will be pleased to:
{{PRAYER}}

Dated this {{FILING_DATE}} day of {{FILING_YEAR}}.

_________________________
{{LAWYER_NAME}}
{{BAR_NUMBER}}
{{FIRM_NAME}}
{{FIRM_ADDRESS}}
Counsel to the {{FILING_PARTY}}
`,
    placeholders: [
      { key: "COURT_NAME", label: "Court Name", type: "select", required: true, options: ["High Court of Lagos State", "High Court of the Federal Capital Territory", "Court of Appeal", "Supreme Court"] },
      { key: "SUIT_NUMBER", label: "Suit Number", type: "text", required: true },
      { key: "PLAINTIFF_NAME", label: "Plaintiff Name", type: "text", required: true },
      { key: "DEFENDANT_NAME", label: "Defendant Name", type: "text", required: true },
      { key: "APPLICATION_TYPE", label: "Application Type", type: "text", required: true, hint: "e.g., Motion, Appeal, Reply" },
      { key: "FILING_PARTY", label: "Filing Party", type: "select", required: true, options: ["Plaintiff", "Defendant", "Applicant", "Respondent"] },
      { key: "ISSUES", label: "Issues for Determination", type: "textarea", required: true },
      { key: "ISSUE_1_ARGUMENT", label: "Issue 1 Argument", type: "textarea", required: true },
      { key: "CASE_1", label: "Case Citation 1", type: "text", required: true, hint: "e.g., [2023] 5 NWLR (Pt. 1234) 45" },
      { key: "CASE_1_HOLDING", label: "Case 1 Holding", type: "textarea", required: true },
      { key: "CASE_2", label: "Case Citation 2", type: "text", required: true },
      { key: "CASE_2_HOLDING", label: "Case 2 Holding", type: "textarea", required: true },
      { key: "ISSUE_2_ARGUMENT", label: "Issue 2 Argument", type: "textarea", required: false },
      { key: "CONCLUSION", label: "Conclusion", type: "textarea", required: true },
      { key: "PRAYER", label: "Prayer", type: "textarea", required: true },
      { key: "FILING_DATE", label: "Filing Date", type: "date", required: true },
      { key: "FILING_YEAR", label: "Filing Year", type: "text", required: true },
      { key: "LAWYER_NAME", label: "Lawyer Name", type: "text", required: true },
      { key: "BAR_NUMBER", label: "Bar Number", type: "text", required: true },
      { key: "FIRM_NAME", label: "Firm Name", type: "text", required: true },
      { key: "FIRM_ADDRESS", label: "Firm Address", type: "textarea", required: true }
    ],
    courtDetails: {
      applicableCourts: ["High Court of Lagos State", "High Court of FCT", "Court of Appeal", "Supreme Court"],
      documentType: "final",
      jurisdiction: "both",
    },
    tags: ["written address", "brief", "argument", "Nigeria"],
    governingLaw: "High Court Civil Procedure Rules",
    status: "active",
    isFeatured: false,
  },
  {
    title: "Power of Attorney (General)",
    description:
      "General Power of Attorney for Nigeria, compliant with Nigerian legal requirements.",
    category: "contract",
    subcategory: "power-of-attorney",
    practiceArea: "general",
    isSystemTemplate: true,
    content: `GENERAL POWER OF ATTORNEY

This General Power of Attorney ("Instrument") is made this {{EXECUTION_DATE}} day of {{YEAR}}

I, {{DONOR_NAME}} of {{DONOR_ADDRESS}} (hereinafter called "the Donor")

DO HEREBY APPOINT:

{{ATTORNEY_NAME}} of {{ATTORNEY_ADDRESS}} (hereinafter called "the Attorney")

TO BE MY TRUE AND LAWFUL ATTORNEY for me and in my name and on my behalf:

1. GENERAL POWERS
To do, execute, and perform all such acts, deeds, matters, and things as my Attorney shall in his/her absolute discretion deem necessary, proper, or expedient for the purposes of:

{{PURPOSES}}

2. SPECIFIC POWERS
Without prejudice to the generality of the foregoing, my Attorney shall have full power and authority to:

a) {{SPECIFIC_POWER_1}}
b) {{SPECIFIC_POWER_2}}
c) {{SPECIFIC_POWER_3}}

3. BINDING EFFECT
This Power of Attorney shall be binding on my heirs, executors, administrators, and assigns.

4. REVOCATION
I hereby reserve the right to revoke this Power of Attorney at any time by giving written notice to my Attorney.

5. GOVERNING LAW
This Instrument shall be governed by the laws of the Federal Republic of Nigeria.

IN WITNESS WHEREOF I have hereunto set my hand on the day and year first above written.

_________________________
{{DONOR_NAME}}
DONOR

Signed, Sealed, and Delivered by the above-named
{{DONOR_NAME}} in the presence of:

Witness: _____________________
Name: {{WITNESS_NAME}}
Address: {{WITNESS_ADDRESS}}
Occupation: {{WITNESS_OCCUPATION}}

ACCEPTED by the above-named
{{ATTORNEY_NAME}} this {{ACCEPTANCE_DATE}} day of {{ACCEPTANCE_YEAR}}

_________________________
{{ATTORNEY_NAME}}
ATTORNEY
`,
    placeholders: [
      { key: "DONOR_NAME", label: "Donor (Principal) Name", type: "text", required: true, hint: "Full name of person granting power of attorney" },
      { key: "DONOR_ADDRESS", label: "Donor Address", type: "textarea", required: true },
      { key: "ATTORNEY_NAME", label: "Attorney Name", type: "text", required: true, hint: "Full name of attorney-in-fact" },
      { key: "ATTORNEY_ADDRESS", label: "Attorney Address", type: "textarea", required: true },
      { key: "EXECUTION_DATE", label: "Execution Date", type: "date", required: true },
      { key: "YEAR", label: "Year", type: "text", required: true },
      { key: "PURPOSES", label: "Purposes", type: "textarea", required: true, hint: "General purposes for which power is granted" },
      { key: "SPECIFIC_POWER_1", label: "Specific Power 1", type: "textarea", required: true },
      { key: "SPECIFIC_POWER_2", label: "Specific Power 2", type: "textarea", required: true },
      { key: "SPECIFIC_POWER_3", label: "Specific Power 3", type: "textarea", required: false },
      { key: "WITNESS_NAME", label: "Witness Name", type: "text", required: true },
      { key: "WITNESS_ADDRESS", label: "Witness Address", type: "textarea", required: true },
      { key: "WITNESS_OCCUPATION", label: "Witness Occupation", type: "text", required: true },
      { key: "ACCEPTANCE_DATE", label: "Acceptance Date", type: "date", required: true },
      { key: "ACCEPTANCE_YEAR", label: "Acceptance Year", type: "text", required: true }
    ],
    tags: ["power of attorney", "POA", "legal document", "Nigeria"],
    governingLaw: "Laws of Nigeria",
    status: "active",
    isFeatured: false,
  },
  {
    title: "Simple Contract Agreement",
    description:
      "A basic contract agreement template for simple business transactions in Nigeria. Suitable for small-scale agreements between parties.",
    category: "contract",
    subcategory: "general",
    practiceArea: "general",
    isSystemTemplate: true,
    content: `SIMPLE CONTRACT AGREEMENT

This Contract Agreement ("Agreement") is made this {{CONTRACT_DATE}} day of {{CONTRACT_YEAR}}

BETWEEN:

{{PARTY_A_NAME}} of {{PARTY_A_ADDRESS}} (hereinafter referred to as "Party A")

AND

{{PARTY_B_NAME}} of {{PARTY_B_ADDRESS}} (hereinafter referred to as "Party B")

WHEREAS:

Party A and Party B have agreed to enter into this Agreement to set out the terms and conditions of their business relationship.

NOW IT IS HEREBY AGREED as follows:

1. TERMS OF AGREEMENT
{{TERMS_DESCRIPTION}}

2. PAYMENT TERMS
The total amount payable under this Agreement is ₦{{TOTAL_AMOUNT}} (Naira {{AMOUNT_IN_WORDS}}).

Payment shall be made as follows:
{{PAYMENT_TERMS}}

3. DURATION
This Agreement shall commence on {{START_DATE}} and shall continue until {{END_DATE}} unless terminated earlier in accordance with the provisions herein.

4. OBLIGATIONS OF PARTY A
{{PARTY_A_OBLIGATIONS}}

5. OBLIGATIONS OF PARTY B
{{PARTY_B_OBLIGATIONS}}

6. CONFIDENTIALITY
Both parties agree to keep confidential all information exchanged during the course of this Agreement.

7. TERMINATION
Either party may terminate this Agreement by giving {{NOTICE_PERIOD}} days written notice to the other party.

8. GOVERNING LAW
This Agreement shall be governed by the laws of Nigeria.

IN WITNESS WHEREOF the parties have executed this Agreement.

_________________________                    _________________________
PARTY A                                        PARTY B
{{PARTY_A_NAME}}                               {{PARTY_B_NAME}}

Date: {{PARTY_A_SIGN_DATE}}                   Date: {{PARTY_B_SIGN_DATE}}

Witness: _____________________              Witness: _____________________
Name: {{WITNESS_NAME}}                        Name: {{WITNESS2_NAME}}
`,
    placeholders: [
      { key: "CONTRACT_DATE", label: "Contract Date", type: "date", required: true, hint: "Date this agreement is signed" },
      { key: "CONTRACT_YEAR", label: "Contract Year", type: "text", required: true, hint: "Year of the contract" },
      { key: "PARTY_A_NAME", label: "Party A Name", type: "text", required: true, hint: "Full name of first party" },
      { key: "PARTY_A_ADDRESS", label: "Party A Address", type: "textarea", required: true, hint: "Address of first party" },
      { key: "PARTY_B_NAME", label: "Party B Name", type: "text", required: true, hint: "Full name of second party" },
      { key: "PARTY_B_ADDRESS", label: "Party B Address", type: "textarea", required: true, hint: "Address of second party" },
      { key: "TERMS_DESCRIPTION", label: "Terms Description", type: "textarea", required: true, hint: "Describe the terms of this agreement" },
      { key: "TOTAL_AMOUNT", label: "Total Amount", type: "currency", required: true, hint: "Total amount in Naira" },
      { key: "AMOUNT_IN_WORDS", label: "Amount in Words", type: "text", required: true, hint: "Amount written in words" },
      { key: "PAYMENT_TERMS", label: "Payment Terms", type: "textarea", required: true, hint: "When and how payment will be made" },
      { key: "START_DATE", label: "Start Date", type: "date", required: true, hint: "When the agreement starts" },
      { key: "END_DATE", label: "End Date", type: "date", required: true, hint: "When the agreement ends" },
      { key: "PARTY_A_OBLIGATIONS", label: "Party A Obligations", type: "textarea", required: true, hint: "What Party A must do" },
      { key: "PARTY_B_OBLIGATIONS", label: "Party B Obligations", type: "textarea", required: true, hint: "What Party B must do" },
      { key: "NOTICE_PERIOD", label: "Notice Period (Days)", type: "number", required: true, defaultValue: "14", hint: "Days of notice for termination" },
      { key: "PARTY_A_SIGN_DATE", label: "Party A Sign Date", type: "date", required: true },
      { key: "PARTY_B_SIGN_DATE", label: "Party B Sign Date", type: "date", required: true },
      { key: "WITNESS_NAME", label: "Witness 1 Name", type: "text", required: true },
      { key: "WITNESS2_NAME", label: "Witness 2 Name", type: "text", required: true }
    ],
    tags: ["contract", "agreement", "simple", "Nigeria"],
    governingLaw: "Laws of Nigeria",
    status: "active",
    isFeatured: true,
  },
];

module.exports = templateSeeds;
