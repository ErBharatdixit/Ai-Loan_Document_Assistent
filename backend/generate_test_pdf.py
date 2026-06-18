import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf():
    pdf_filename = "test_scheme_document.pdf"
    
    # Setup document
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1A365D'),
        spaceAfter=12
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#4A5568'),
        spaceAfter=20
    )
    
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#2C5282'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['BodyText'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#2D3748'),
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#2D3748'),
        leftIndent=20,
        firstLineIndent=-10,
        spaceAfter=4
    )

    story = []
    
    # Title & Header
    story.append(Paragraph("PRADHAN MANTRI MUDRA YOJANA (PMMY)", title_style))
    story.append(Paragraph("Official Scheme Guidelines & Eligibility Framework | Government of India", subtitle_style))
    story.append(Spacer(1, 10))
    
    # Section 1: Overview
    story.append(Paragraph("1. Scheme Overview", section_heading))
    story.append(Paragraph(
        "Pradhan Mantri MUDRA Yojana (PMMY) is a flagship scheme of Government of India to "
        "provide formal financial assistance and loans up to 10 Lakhs to non-corporate, non-farm small/micro enterprises. "
        "These loans are classified as MUDRA loans under PMMY. Commercial Banks, RRBs, Small Finance Banks, "
        "MFIs and NBFCs are authorized to lend under this scheme.",
        body_style
    ))
    
    # Section 2: Loan Categories
    story.append(Paragraph("2. Loan Categories & Limits", section_heading))
    story.append(Paragraph(
        "Mudra loans are divided into three distinct categories based on the stage of growth and funding needs of the beneficiary micro unit:",
        body_style
    ))
    
    # Table data
    data = [
        [Paragraph("<b>Category</b>", body_style), Paragraph("<b>Loan Amount Limit</b>", body_style), Paragraph("<b>Target Stage</b>", body_style)],
        [Paragraph("Shishu", body_style), Paragraph("Up to Rs. 50,000", body_style), Paragraph("Startups and initial business setup phase", body_style)],
        [Paragraph("Kishor", body_style), Paragraph("Rs. 50,001 to Rs. 5,00,000", body_style), Paragraph("Established businesses seeking expansion capital", body_style)],
        [Paragraph("Tarun", body_style), Paragraph("Rs. 5,00,001 to Rs. 10,00,000", body_style), Paragraph("Larger micro units requiring significant scale-up funds", body_style)]
    ]
    
    t = Table(data, colWidths=[100, 150, 280])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#EDF2F7')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E0')),
    ]))
    story.append(t)
    story.append(Spacer(1, 15))
    
    # Section 3: Eligibility Criteria
    story.append(Paragraph("3. Eligibility Criteria", section_heading))
    story.append(Paragraph("To apply for a Mudra Loan under PMMY, the applicant must satisfy the following conditions:", body_style))
    story.append(Paragraph("• <b>Age limit:</b> The applicant must be between 18 and 65 years of age.", bullet_style))
    story.append(Paragraph("• <b>Citizenship:</b> Must be an Indian citizen with valid proof of identity.", bullet_style))
    story.append(Paragraph("• <b>Business Type:</b> Non-farm enterprise in manufacturing, trading, retail, or service sectors.", bullet_style))
    story.append(Paragraph("• <b>Credit Score:</b> Minimum CIBIL score of 650 with no history of default on previous commercial loans.", bullet_style))
    story.append(Paragraph("• <b>Purpose:</b> Loan must be used solely for business promotion, working capital, or equipment purchasing.", bullet_style))
    story.append(Spacer(1, 10))
    
    # Section 4: Required Documentation Checklist
    story.append(Paragraph("4. Required Documentation Checklist", section_heading))
    story.append(Paragraph("Applicants must submit the following documents along with their application form:", body_style))
    story.append(Paragraph("1. <b>Proof of Identity:</b> Self-attested copy of Aadhaar Card, PAN Card, or Voter ID.", bullet_style))
    story.append(Paragraph("2. <b>Proof of Residence:</b> Utility bill (electricity/water), registry copy, or rent agreement.", bullet_style))
    story.append(Paragraph("3. <b>Business Address Proof:</b> Shop & Establishment Certificate, GST registration, or business license.", bullet_style))
    story.append(Paragraph("4. <b>Financial Records:</b> Last 12 months bank statement of the active business account.", bullet_style))
    story.append(Paragraph("5. <b>Project Report:</b> A concise business plan or project feasibility report detailing investment requirements.", bullet_style))
    
    # Build document
    doc.build(story)
    print(f"Successfully generated PDF: {pdf_filename}")

if __name__ == "__main__":
    generate_pdf()
