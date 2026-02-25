#!/usr/bin/env python3
"""
Update companies with enhanced financial data
"""

import json
import os

# Enhanced financial data for each company
FINANCIAL_DATA = {
    "company_doordash": {
        "monthly_revenue": 75000,
        "burn_rate": 150000,
        "runway_months": 20,
        "growth_percent": 45,
        "lead_investor": "Sequoia Capital",
        "total_funding": 2500000,
        "employees": 35,
        "founded": "2013",
        "revenue_run_rate": 900000,
        "net_revenue_retention": 115,
        "cac": 120,
        "ltv_cac_ratio": 3.2,
        "gross_margin": 25
    },
    "company_stripe": {
        "monthly_revenue": 150000,
        "burn_rate": 200000,
        "runway_months": 25,
        "growth_percent": 35,
        "lead_investor": "Peter Thiel",
        "total_funding": 2000000,
        "employees": 45,
        "founded": "2010",
        "revenue_run_rate": 1800000,
        "net_revenue_retention": 140,
        "cac": 500,
        "ltv_cac_ratio": 4.5,
        "gross_margin": 75
    },
    "company_reddit": {
        "monthly_revenue": 5000,
        "burn_rate": 80000,
        "runway_months": 18,
        "growth_percent": 100,
        "lead_investor": "Y Combinator",
        "total_funding": 100000,
        "employees": 8,
        "founded": "2005",
        "revenue_run_rate": 60000,
        "net_revenue_retention": 105,
        "cac": 5,
        "ltv_cac_ratio": 2.8,
        "gross_margin": 70
    },
    "company_airbnb": {
        "monthly_revenue": 200000,
        "burn_rate": 300000,
        "runway_months": 30,
        "growth_percent": 60,
        "lead_investor": "Sequoia Capital",
        "total_funding": 7200000,
        "employees": 25,
        "founded": "2008",
        "revenue_run_rate": 2400000,
        "net_revenue_retention": 125,
        "cac": 80,
        "ltv_cac_ratio": 3.5,
        "gross_margin": 15
    },
    "company_coinbase": {
        "monthly_revenue": 20000,
        "burn_rate": 100000,
        "runway_months": 15,
        "growth_percent": 80,
        "lead_investor": "Union Square Ventures",
        "total_funding": 600000,
        "employees": 12,
        "founded": "2012",
        "revenue_run_rate": 240000,
        "net_revenue_retention": 120,
        "cac": 200,
        "ltv_cac_ratio": 3.0,
        "gross_margin": 85
    },
    "company_dropbox": {
        "monthly_revenue": 10000,
        "burn_rate": 50000,
        "runway_months": 24,
        "growth_percent": 50,
        "lead_investor": "Sequoia Capital",
        "total_funding": 1200000,
        "employees": 10,
        "founded": "2008",
        "revenue_run_rate": 120000,
        "net_revenue_retention": 110,
        "cac": 50,
        "ltv_cac_ratio": 3.8,
        "gross_margin": 68
    },
    "company_instacart": {
        "monthly_revenue": 100000,
        "burn_rate": 250000,
        "runway_months": 16,
        "growth_percent": 40,
        "lead_investor": "Andreessen Horowitz",
        "total_funding": 2900000,
        "employees": 40,
        "founded": "2012",
        "revenue_run_rate": 1200000,
        "net_revenue_retention": 118,
        "cac": 60,
        "ltv_cac_ratio": 2.5,
        "gross_margin": 18
    },
    "company_mixpanel": {
        "monthly_revenue": 45000,
        "burn_rate": 120000,
        "runway_months": 22,
        "growth_percent": 30,
        "lead_investor": "Andreessen Horowitz",
        "total_funding": 1250000,
        "employees": 20,
        "founded": "2009",
        "revenue_run_rate": 540000,
        "net_revenue_retention": 130,
        "cac": 800,
        "ltv_cac_ratio": 4.0,
        "gross_margin": 82
    },
    "company_twitch": {
        "monthly_revenue": 80000,
        "burn_rate": 180000,
        "runway_months": 20,
        "growth_percent": 55,
        "lead_investor": "Bessemer Venture Partners",
        "total_funding": 1500000,
        "employees": 30,
        "founded": "2011",
        "revenue_run_rate": 960000,
        "net_revenue_retention": 112,
        "cac": 25,
        "ltv_cac_ratio": 3.3,
        "gross_margin": 50
    },
    "company_weebly": {
        "monthly_revenue": 15000,
        "burn_rate": 60000,
        "runway_months": 20,
        "growth_percent": 45,
        "lead_investor": "Sequoia Capital",
        "total_funding": 650000,
        "employees": 8,
        "founded": "2007",
        "revenue_run_rate": 180000,
        "net_revenue_retention": 108,
        "cac": 30,
        "ltv_cac_ratio": 3.6,
        "gross_margin": 72
    },
    "company_optimizely": {
        "monthly_revenue": 120000,
        "burn_rate": 220000,
        "runway_months": 28,
        "growth_percent": 25,
        "lead_investor": "Benchmark Capital",
        "total_funding": 2800000,
        "employees": 35,
        "founded": "2010",
        "revenue_run_rate": 1440000,
        "net_revenue_retention": 135,
        "cac": 1200,
        "ltv_cac_ratio": 3.8,
        "gross_margin": 78
    },
    "company_rappi": {
        "monthly_revenue": 850000,
        "burn_rate": 1200000,
        "runway_months": 35,
        "growth_percent": 70,
        "lead_investor": "DST Global",
        "total_funding": 9000000,
        "employees": 180,
        "founded": "2015",
        "revenue_run_rate": 10200000,
        "net_revenue_retention": 122,
        "cac": 45,
        "ltv_cac_ratio": 2.2,
        "gross_margin": 12
    },
    "company_pagerduty": {
        "monthly_revenue": 90000,
        "burn_rate": 160000,
        "runway_months": 24,
        "growth_percent": 38,
        "lead_investor": "Baseline Ventures",
        "total_funding": 1800000,
        "employees": 28,
        "founded": "2009",
        "revenue_run_rate": 1080000,
        "net_revenue_retention": 128,
        "cac": 1000,
        "ltv_cac_ratio": 4.2,
        "gross_margin": 83
    },
    "company_docker": {
        "monthly_revenue": 60000,
        "burn_rate": 140000,
        "runway_months": 21,
        "growth_percent": 42,
        "lead_investor": "Greylock Partners",
        "total_funding": 1100000,
        "employees": 25,
        "founded": "2013",
        "revenue_run_rate": 720000,
        "net_revenue_retention": 125,
        "cac": 600,
        "ltv_cac_ratio": 3.5,
        "gross_margin": 65
    },
    "company_cruise": {
        "monthly_revenue": 0,
        "burn_rate": 800000,
        "runway_months": 30,
        "growth_percent": 0,
        "lead_investor": "Sam Altman",
        "total_funding": 3200000,
        "employees": 50,
        "founded": "2013",
        "revenue_run_rate": 0,
        "net_revenue_retention": 0,
        "cac": 0,
        "ltv_cac_ratio": 0,
        "gross_margin": 0
    },
    "company_flexport": {
        "monthly_revenue": 180000,
        "burn_rate": 280000,
        "runway_months": 26,
        "growth_percent": 48,
        "lead_investor": "Founders Fund",
        "total_funding": 2600000,
        "employees": 42,
        "founded": "2013",
        "revenue_run_rate": 2160000,
        "net_revenue_retention": 115,
        "cac": 2000,
        "ltv_cac_ratio": 2.8,
        "gross_margin": 20
    }
}

def update_companies():
    data_file = 'storage/data.json'
    
    # Load existing data
    with open(data_file, 'r') as f:
        data = json.load(f)
    
    # Update each company with enhanced financial data
    companies = data.get("companies", {})
    
    for company_id, company in companies.items():
        if company_id in FINANCIAL_DATA:
            financial_info = FINANCIAL_DATA[company_id]
            
            # Update basic financial metrics
            company["revenue"] = financial_info["monthly_revenue"]
            company["burn_rate"] = financial_info["burn_rate"]
            company["runway_months"] = financial_info["runway_months"]
            company["growth_percent"] = financial_info["growth_percent"]
            company["lead_investor"] = financial_info["lead_investor"]
            
            # Add new financial fields
            company["total_funding"] = financial_info["total_funding"]
            company["employees"] = financial_info["employees"]
            company["founded"] = financial_info["founded"]
            company["revenue_run_rate"] = financial_info["revenue_run_rate"]
            company["net_revenue_retention"] = financial_info["net_revenue_retention"]
            company["cac"] = financial_info["cac"]
            company["ltv_cac_ratio"] = financial_info["ltv_cac_ratio"]
            company["gross_margin"] = financial_info["gross_margin"]
            
            print(f"Updated {company['name']} with enhanced financial data")
    
    # Save updated data
    with open(data_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"\n✅ Successfully updated {len(companies)} companies with financial data!")

if __name__ == "__main__":
    update_companies()