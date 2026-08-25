const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'STATE DATA INDIA');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

const statesData = [
    {
        name: 'Maharashtra',
        economicProfile: [
            ['Indicator', 'Value', 'Unit', 'Reference Year', 'Status', 'Source', 'Notes'],
            ['Population (Projected)', '13,28,20,000 (132.82 million)', 'Persons', '2024', 'Projected', 'National Commission on Population', 'Accounts for ~9% of India'],
            ['Gross State Domestic Product (Current Prices)', '₹46,22,000 crore', 'INR Crore', '2024-25', 'Estimates', 'Economic Survey of Maharashtra 2025-26', 'Largest state economy (~14% of National GDP)'],
            ['Per Capita Income', '₹3,17,801', 'INR', '2024-25', 'Estimates', 'Economic Survey of Maharashtra 2025-26', 'Significantly higher than national average (₹2,19,575)'],
            ['GSDP Growth Rate (Nominal)', '0.073', 'Percent', '2024-25', 'Actual', 'Economic Survey of Maharashtra 2025-26', 'Projected 7.9% for 2025-26'],
        ],
        incomeClass: [
            ['Income Class', 'Definition', 'Annual HH Income Range (₹)', 'Reference Year'],
            ['Poor / Ultra-Low Income', 'Below poverty line; daily wage workers', 'Below ₹1,50,000', '2025 (Est.)'],
            ['Lower Middle Class', 'Regular employment; informal sector', '₹1,50,000 - ₹3,00,000', '2025 (Est.)'],
            ['Middle Class', 'Salaried professionals, small business owners', '₹3,00,000 - ₹6,00,000', '2025 (Est.)'],
            ['Upper Middle Class', 'Senior professionals, business owners', '₹6,00,000 - ₹15,00,000', '2025 (Est.)'],
            ['Affluent / Rich', 'High net worth individuals (High concentration in Mumbai/Pune)', 'Above ₹15,00,000', '2025 (Est.)'],
        ],
        sources: [
            ['Source Name', 'Publication/Report', 'Year', 'URL/Reference', 'Type'],
            ['State Finance Department', 'Economic Survey of Maharashtra 2025-26', '2026', 'Official State Publication', 'Actual'],
            ['MoSPI & NITI Aayog', 'India Climate & Energy Dashboard (ICED)', '2025', 'https://iced.niti.gov.in', 'Actual/Projected'],
            ['PRICE', 'ICE 360° Surveys', '2023-24', 'https://www.ice360.in/', 'Estimated/Survey']
        ]
    }
];

statesData.forEach(state => {
    const wb = xlsx.utils.book_new();

    const wsEconomic = xlsx.utils.aoa_to_sheet(state.economicProfile);
    xlsx.utils.book_append_sheet(wb, wsEconomic, 'Economic Profile');

    const wsIncome = xlsx.utils.aoa_to_sheet(state.incomeClass);
    xlsx.utils.book_append_sheet(wb, wsIncome, 'Income Class Distribution');

    const wsSources = xlsx.utils.aoa_to_sheet(state.sources);
    xlsx.utils.book_append_sheet(wb, wsSources, 'Sources');

    const filePath = path.join(outputDir, `${state.name} Research.xlsx`);
    xlsx.writeFile(wb, filePath);
    console.log(`Generated: ${filePath}`);
});
