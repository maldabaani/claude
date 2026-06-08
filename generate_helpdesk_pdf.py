from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
    PageBreak, Table, TableStyle, KeepTogether
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate
from reportlab.lib.colors import HexColor
from datetime import datetime

OUTPUT_PATH = "/home/user/claude/HelpDesk_Pro_Features.pdf"

DEEP_BLUE = HexColor("#1e3a5f")
LIGHT_BLUE = HexColor("#e8f0f8")
WHITE = colors.white
DARK_TEXT = HexColor("#1a1a2e")
GRAY = HexColor("#666666")
LIGHT_GRAY = HexColor("#f5f7fa")
ACCENT = HexColor("#2d6bcd")

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 20 * mm

FEATURES = [
    ("Ticket Management", "🎫", [
        "Create tickets (web form with help topic routing)",
        "View & update ticket details (subject, description, status, priority, category)",
        "Ticket status workflow — Open → In Progress → Waiting → Resolved → Closed",
        "Priority levels — Critical, High, Medium, Low",
        "Department-based routing",
        "Ticket merging (consolidate duplicates)",
        "Due dates (manual, with overdue highlighting)",
        "Ticket templates (pre-filled forms for common request types)",
        "Help Topics (customer-facing categories that auto-set department/priority)",
        "Bulk actions (assign, change status, priority on multiple tickets at once)",
        "Export tickets to CSV",
    ]),
    ("Communication", "💬", [
        "Public replies (customer-visible comments)",
        "Internal notes (agent-only, hidden from customers)",
        "@mentions in internal notes (autocomplete agent names)",
        "Canned responses (insert pre-written replies)",
        "CC / Watchers (add email addresses to receive ticket notifications)",
        "File attachments (upload/download files on tickets and comments)",
        "Inbound email-to-ticket (IMAP polling auto-creates tickets from incoming emails)",
        "Outbound email notifications (ticket created, assigned, status changed, comment added, SLA breached, CSAT survey)",
        "Rich email threading",
    ]),
    ("Customer Portal", "👤", [
        "Submit tickets (with help topic, template, file upload)",
        "View own tickets and status",
        "Reply to tickets",
        "Knowledge base (browse articles, search, mark helpful)",
        "CSAT rating (rate support experience after ticket closes)",
        "Customer profile (update name, change password)",
    ]),
    ("Agent Tools", "🧑‍💼", [
        "Agent queue (filterable ticket list with search, saved views)",
        "Ticket assignment (manual assign to agent)",
        "Collision detection (warning when multiple agents view same ticket)",
        "Task management (sub-task checklist per ticket with progress tracking)",
        "Saved filter views (named filter presets)",
        "Link tickets to Issues (group related tickets)",
        "Custom field values (fill in admin-defined fields per ticket)",
        "Watchers management (add/remove CC emails from sidebar)",
    ]),
    ("Admin Configuration", "🔧", [
        "User management (create/edit agents, customers, team leads)",
        "Department management",
        "SLA Plans (response/resolution targets per priority)",
        "SLA Escalation Rules (auto-notify/reassign at configurable thresholds)",
        "Custom Ticket Fields (text, dropdown, date, checkbox)",
        "Canned Responses management",
        "Knowledge Base management (categories + articles)",
        "Ticket Templates management",
        "Help Topics management",
        "Email Inboxes (configure IMAP inboxes for email-to-ticket)",
        "Email Notification toggles (per event type on/off)",
        "Business Hours configuration (start/end time, days, timezone)",
        "Auto-assignment toggle (round-robin by workload)",
        "General settings (company name, support email)",
    ]),
    ("Organizations", "🏢", [
        "Organization / Company accounts",
        "Group customers under a company",
        "Org-level ticket visibility (members see each other's tickets)",
        "Member management (add/remove users from org)",
    ]),
    ("Analytics & Reporting", "📊", [
        "Analytics dashboard (KPI cards, daily ticket volume chart, agent performance table)",
        "7 / 30 / 90 day date range selector",
        "Audit log (full history of all system actions)",
    ]),
    ("Integrations & API", "🔗", [
        "Outbound Webhooks (POST to external URLs on ticket events, HMAC-signed)",
        "Webhook test endpoint",
        "API Key management (generate, revoke, one-time display)",
        "Issue Tracking (group tickets under a parent issue)",
    ]),
    ("Security & Auth", "🔒", [
        "JWT authentication (access + refresh tokens)",
        "Role-based access control (Admin, Team Lead, Agent, Customer)",
        "Two-Factor Authentication (TOTP via authenticator app)",
        "Password change from profile",
        "BCrypt password hashing",
    ]),
    ("UI/UX", "🎨", [
        "Dark mode (toggle in header, persisted in localStorage)",
        "Real-time notifications (WebSocket/STOMP)",
        "Global search (tickets by subject/description)",
        "PrimeNG 18 component library (Aura theme)",
        "Responsive TailwindCSS layout",
    ]),
]

def add_page_decorations(canvas, doc):
    canvas.saveState()
    # Footer bar
    canvas.setFillColor(DEEP_BLUE)
    canvas.rect(0, 0, PAGE_WIDTH, 14 * mm, fill=1, stroke=0)
    # Footer text
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica", 8)
    canvas.drawCentredString(PAGE_WIDTH / 2, 5 * mm, "HelpDesk Pro — Confidential")
    # Page number
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(PAGE_WIDTH - MARGIN, 5 * mm, f"Page {doc.page}")
    # Top accent line
    canvas.setFillColor(ACCENT)
    canvas.rect(0, PAGE_HEIGHT - 3 * mm, PAGE_WIDTH, 3 * mm, fill=1, stroke=0)
    canvas.restoreState()

def cover_page_decorations(canvas, doc):
    canvas.saveState()
    # Full deep blue top band
    canvas.setFillColor(DEEP_BLUE)
    canvas.rect(0, PAGE_HEIGHT * 0.55, PAGE_WIDTH, PAGE_HEIGHT * 0.45, fill=1, stroke=0)
    # Bottom footer
    canvas.setFillColor(DEEP_BLUE)
    canvas.rect(0, 0, PAGE_WIDTH, 14 * mm, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica", 8)
    canvas.drawCentredString(PAGE_WIDTH / 2, 5 * mm, "HelpDesk Pro — Confidential")
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(PAGE_WIDTH - MARGIN, 5 * mm, f"Page {doc.page}")
    canvas.restoreState()

class HelpDeskDoc(BaseDocTemplate):
    def __init__(self, filename, **kwargs):
        BaseDocTemplate.__init__(self, filename, **kwargs)
        self.is_cover = True
        frame_cover = Frame(MARGIN, 14*mm + 5*mm, PAGE_WIDTH - 2*MARGIN,
                            PAGE_HEIGHT - 14*mm - 10*mm, id='cover')
        frame_normal = Frame(MARGIN, 14*mm + 8*mm, PAGE_WIDTH - 2*MARGIN,
                             PAGE_HEIGHT - 14*mm - 3*mm - 16*mm, id='normal')
        self.addPageTemplates([
            PageTemplate(id='Cover', frames=frame_cover, onPage=cover_page_decorations),
            PageTemplate(id='Normal', frames=frame_normal, onPage=add_page_decorations),
        ])

    def afterFlowable(self, flowable):
        if hasattr(flowable, 'style') and hasattr(flowable.style, 'name'):
            if flowable.style.name == 'SectionHeading':
                text = flowable.getPlainText() if hasattr(flowable, 'getPlainText') else str(flowable)
                self.notify('TOCEntry', (0, text, self.page, None))


def build_pdf():
    doc = HelpDeskDoc(OUTPUT_PATH, pagesize=A4)

    styles = getSampleStyleSheet()

    style_cover_title = ParagraphStyle(
        'CoverTitle', fontSize=44, textColor=WHITE,
        fontName='Helvetica-Bold', alignment=TA_CENTER,
        spaceAfter=6
    )
    style_cover_subtitle = ParagraphStyle(
        'CoverSubtitle', fontSize=20, textColor=HexColor("#a8c8e8"),
        fontName='Helvetica', alignment=TA_CENTER,
        spaceAfter=4
    )
    style_cover_date = ParagraphStyle(
        'CoverDate', fontSize=13, textColor=HexColor("#c0d8f0"),
        fontName='Helvetica', alignment=TA_CENTER
    )
    style_cover_body = ParagraphStyle(
        'CoverBody', fontSize=11, textColor=DARK_TEXT,
        fontName='Helvetica', alignment=TA_CENTER, leading=18
    )
    style_toc_title = ParagraphStyle(
        'TOCTitle', fontSize=22, textColor=DEEP_BLUE,
        fontName='Helvetica-Bold', alignment=TA_CENTER,
        spaceAfter=6, spaceBefore=10
    )
    style_toc_entry = ParagraphStyle(
        'TOCEntry', fontSize=11, textColor=DARK_TEXT,
        fontName='Helvetica', leading=22, leftIndent=0
    )
    style_toc_entry_num = ParagraphStyle(
        'TOCEntryNum', fontSize=11, textColor=ACCENT,
        fontName='Helvetica-Bold', leading=22
    )
    style_section = ParagraphStyle(
        'SectionHeading', fontSize=13, textColor=WHITE,
        fontName='Helvetica-Bold', alignment=TA_LEFT,
        spaceAfter=0, spaceBefore=0,
        leftIndent=6
    )
    style_feature = ParagraphStyle(
        'Feature', fontSize=10, textColor=DARK_TEXT,
        fontName='Helvetica', leading=17,
        leftIndent=14, firstLineIndent=0
    )
    style_body = ParagraphStyle(
        'Body', fontSize=11, textColor=DARK_TEXT,
        fontName='Helvetica', leading=18, alignment=TA_CENTER
    )

    from reportlab.platypus import NextPageTemplate
    story = []

    # ─── COVER PAGE ─────────────────────────────────────────────────────────────
    story.append(NextPageTemplate('Cover'))
    story.append(Spacer(1, PAGE_HEIGHT * 0.10))
    story.append(Paragraph("HelpDesk Pro", style_cover_title))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Complete Feature List", style_cover_subtitle))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("June 2026", style_cover_date))

    # Transition to white area
    story.append(Spacer(1, PAGE_HEIGHT * 0.18))

    story.append(HRFlowable(width="80%", thickness=2, color=DEEP_BLUE, spaceAfter=12, spaceBefore=4))

    total_features = sum(len(f[2]) for f in FEATURES)
    story.append(Paragraph(
        f"<b>{total_features} Features</b> across <b>{len(FEATURES)} Categories</b>",
        style_body
    ))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(
        "This document provides a comprehensive overview of all features<br/>"
        "available in HelpDesk Pro, the modern customer support platform.",
        style_cover_body
    ))

    from reportlab.platypus import NextPageTemplate
    story.append(NextPageTemplate('Normal'))
    story.append(PageBreak())

    # ─── TABLE OF CONTENTS PAGE ─────────────────────────────────────────────────
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph("Table of Contents", style_toc_title))
    story.append(HRFlowable(width="100%", thickness=1.5, color=DEEP_BLUE, spaceAfter=8))
    story.append(Spacer(1, 4 * mm))

    feature_number = 1
    toc_data = []
    for i, (section_name, emoji, features) in enumerate(FEATURES, 1):
        count = len(features)
        end = feature_number + count - 1
        range_str = f"{feature_number}–{end}"
        feature_number += count

        row = [
            Paragraph(f"<b>{i:02d}.</b>", style_toc_entry_num),
            Paragraph(f"{section_name}", style_toc_entry),
            Paragraph(f"<font color='#666666'>{count} features</font>", style_toc_entry),
            Paragraph(f"<font color='#aaaaaa'>{range_str}</font>", style_toc_entry),
        ]
        toc_data.append(row)

    toc_table = Table(toc_data, colWidths=[18*mm, 90*mm, 38*mm, 25*mm])
    toc_table.setStyle(TableStyle([
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [WHITE, LIGHT_GRAY]),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEBELOW', (0, -1), (-1, -1), 1.5, DEEP_BLUE),
        ('LINEABOVE', (0, 0), (-1, 0), 1.5, DEEP_BLUE),
    ]))
    story.append(toc_table)
    story.append(Spacer(1, 6 * mm))

    total_row = Table([[
        Paragraph("", style_toc_entry),
        Paragraph("<b>Total Features</b>", style_toc_entry),
        Paragraph(f"<b><font color='#1e3a5f'>{total_features} features</font></b>", style_toc_entry),
        Paragraph("", style_toc_entry),
    ]], colWidths=[18*mm, 90*mm, 38*mm, 25*mm])
    total_row.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BLUE),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 1.5, DEEP_BLUE),
    ]))
    story.append(total_row)

    story.append(PageBreak())

    # ─── FEATURE SECTIONS ───────────────────────────────────────────────────────
    feature_number = 1
    for section_name, emoji, features in FEATURES:
        section_items = []

        # Section header as colored table row
        header_table = Table(
            [[Paragraph(f"{section_name}  —  {len(features)} features", style_section)]],
            colWidths=[PAGE_WIDTH - 2 * MARGIN]
        )
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), DEEP_BLUE),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        section_items.append(header_table)
        section_items.append(Spacer(1, 2 * mm))

        # Feature rows
        rows = []
        for feat in features:
            rows.append([
                Paragraph(f"<font color='#2d6bcd'><b>✓</b></font>", style_feature),
                Paragraph(f"<b>{feature_number}.</b>  {feat}", style_feature),
            ])
            feature_number += 1

        feat_table = Table(rows, colWidths=[8*mm, PAGE_WIDTH - 2*MARGIN - 8*mm])
        feat_table.setStyle(TableStyle([
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [WHITE, LIGHT_GRAY]),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LINEBELOW', (0, -1), (-1, -1), 0.5, HexColor("#cccccc")),
        ]))
        section_items.append(feat_table)
        section_items.append(Spacer(1, 8 * mm))

        story.append(KeepTogether(section_items[:2] + [feat_table]))
        story.append(Spacer(1, 8 * mm))

    doc.build(story)
    print(f"PDF created: {OUTPUT_PATH}")

if __name__ == "__main__":
    build_pdf()
