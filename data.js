const siemensDiagnostic = {
    "CPU S7-300/400": [
        { code: "SF", desc: "System Fault. Системная ошибка (программная или аппаратная).", action: "Проверьте буфер диагностики в Step7/TIA Portal." },
        { code: "EXTF", desc: "External Fault. Внешняя ошибка (обрыв линии, отсутствие питания).", action: "Проверьте внешние цепи и предохранители на модулях." },
        { code: "BUSF", desc: "Bus Fault. Ошибка PROFIBUS/PROFINET.", action: "Проверьте целостность кабеля, разъемы и адресацию узлов." }
    ],
    "Модули AI/AO": [
        { code: "7FFF", desc: "Верхний предел (Overflow). Сигнал выше 20мА или КЗ.", action: "Проверьте исправность датчика и полярность подключения." },
        { code: "8000", desc: "Нижний предел (Underflow). Обрыв линии или сигнал < 4мА.", action: "Проверьте целостность петли 4-20мА." }
    ]
};

const blockData = {
    "block_1": { title: "Блок 1", items: [] },
    "block_2": { title: "Блок 2", items: [] },
    "block_3": { title: "Блок 3", items: [] },
    "block_4": { title: "Блок 4", items: [] },
    "block_5": { title: "Блок 5", items: [] },
    "block_6": { title: "Блок 6", items: [] },
    "siemens_diag": {
        title: "Диагностика Siemens",
        items: [
            ...siemensDiagnostic["CPU S7-300/400"].map(item => ({ title: item.code, desc: `${item.desc}<br><br><b style="color:#10b981; text-transform:uppercase; font-size:10px;">Решение:</b><br>${item.action}` })),
            ...siemensDiagnostic["Модули AI/AO"].map(item => ({ title: item.code, desc: `${item.desc}<br><br><b style="color:#10b981; text-transform:uppercase; font-size:10px;">Решение:</b><br>${item.action}` }))
        ]
    },
    "other": {
        title: "Инструкции",
        items: [
            { title: "Руководство S-400", link: "docs/S7-400_instalation.pdf" }
        ]
    },
    "zip": { title: "ЗИП АСУ ТП", items: [] }
};

// Список праздничных дней 2026 (официальные выходные РФ)
const holidays2026 = [
    "2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04", "2026-01-05", "2026-01-06", "2026-01-07", "2026-01-08",
    "2026-02-23", "2026-03-08", "2026-05-01", "2026-05-09", "2026-06-12", "2026-11-04"
];

// График смен на 2026 год (все месяцы)
const scheduleData = {
    "Январь": [
        { name: "Лагутенков Р.С.", shifts: Array(31).fill("") },
        { name: "Миронов С.А.", shifts: Array(31).fill("") },
        { name: "Куштанов К.А.", shifts: Array(31).fill("") },
        { name: "Сучков Д.В.", shifts: Array(31).fill("") },
        { name: "Рыжих И.Н.", shifts: Array(31).fill("") },
        { name: "Бондаренко Т.А.", shifts: Array(31).fill("") }
    ],
    "Февраль": [
        { name: "Лагутенков Р.С.", shifts: Array(28).fill("") },
        { name: "Миронов С.А.", shifts: Array(28).fill("") },
        { name: "Куштанов К.А.", shifts: Array(28).fill("") },
        { name: "Сучков Д.В.", shifts: Array(28).fill("") },
        { name: "Рыжих И.Н.", shifts: Array(28).fill("") },
        { name: "Бондаренко Т.А.", shifts: Array(28).fill("") }
    ],
    "Март": [
        { name: "Лагутенков Р.С.", shifts: Array(31).fill("") },
        { name: "Миронов С.А.", shifts: Array(31).fill("") },
        { name: "Куштанов К.А.", shifts: Array(31).fill("") },
        { name: "Сучков Д.В.", shifts: Array(31).fill("") },
        { name: "Рыжих И.Н.", shifts: Array(31).fill("") },
        { name: "Бондаренко Т.А.", shifts: Array(31).fill("") }
    ],
    "Апрель": [
        { name: "Лагутенков Р.С.", shifts: ["", "", "D", "D", "", "", "S", "N", "", "", "D", "", "", "", "D", "N", "", "N", "", "N", "", "", "D", "N", "N", "", "D", "N", "", ""] },
        { name: "Миронов С.А.", shifts: ["", "", "D", "D", "", "", "", "N", "", "S", "D", "", "", "", "D", "N", "", "N", "", "N", "", "", "D", "N", "N", "", "D", "N", "", ""] },
        { name: "Куштанов К.А.", shifts: ["", "D", "N", "N", "", "S", "N", "", "", "D", "N", "", "", "D", "N", "", "", "D", "", "", "", "D", "N", "", "", "", "N", "", "", "D"] },
        { name: "Сучков Д.В.", shifts: ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "N", "", "", "D"] },
        { name: "Рыжих И.Н.", shifts: ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "D", "", "", "", "D", "N", "", "", "", "N", "", "", "D"] },
        { name: "Бондаренко Т.А.", shifts: ["О", "О", "О", "О", "О", "О", "О", "О", "О", "О", "О", "О", "О", "О", "О", "О", "О", "О", "О", "О", "О", "О", "О", "О", "О", "О", "О", "О", "О", "О"] }
    ],
    "Май": [
        { name: "Лагутенков Р.С.", shifts: Array(31).fill("") },
        { name: "Миронов С.А.", shifts: Array(31).fill("") },
        { name: "Куштанов К.А.", shifts: Array(31).fill("") },
        { name: "Сучков Д.В.", shifts: Array(31).fill("") },
        { name: "Рыжих И.Н.", shifts: Array(31).fill("") },
        { name: "Бондаренко Т.А.", shifts: Array(31).fill("") }
    ],
    "Июнь": [
        { name: "Лагутенков Р.С.", shifts: Array(30).fill("") },
        { name: "Миронов С.А.", shifts: Array(30).fill("") },
        { name: "Куштанов К.А.", shifts: Array(30).fill("") },
        { name: "Сучков Д.В.", shifts: Array(30).fill("") },
        { name: "Рыжих И.Н.", shifts: Array(30).fill("") },
        { name: "Бондаренко Т.А.", shifts: Array(30).fill("") }
    ],
    "Июль": [
        { name: "Лагутенков Р.С.", shifts: Array(31).fill("") },
        { name: "Миронов С.А.", shifts: Array(31).fill("") },
        { name: "Куштанов К.А.", shifts: Array(31).fill("") },
        { name: "Сучков Д.В.", shifts: Array(31).fill("") },
        { name: "Рыжих И.Н.", shifts: Array(31).fill("") },
        { name: "Бондаренко Т.А.", shifts: Array(31).fill("") }
    ],
    "Август": [
        { name: "Лагутенков Р.С.", shifts: Array(31).fill("") },
        { name: "Миронов С.А.", shifts: Array(31).fill("") },
        { name: "Куштанов К.А.", shifts: Array(31).fill("") },
        { name: "Сучков Д.В.", shifts: Array(31).fill("") },
        { name: "Рыжих И.Н.", shifts: Array(31).fill("") },
        { name: "Бондаренко Т.А.", shifts: Array(31).fill("") }
    ],
    "Сентябрь": [
        { name: "Лагутенков Р.С.", shifts: Array(30).fill("") },
        { name: "Миронов С.А.", shifts: Array(30).fill("") },
        { name: "Куштанов К.А.", shifts: Array(30).fill("") },
        { name: "Сучков Д.В.", shifts: Array(30).fill("") },
        { name: "Рыжих И.Н.", shifts: Array(30).fill("") },
        { name: "Бондаренко Т.А.", shifts: Array(30).fill("") }
    ],
    "Октябрь": [
        { name: "Лагутенков Р.С.", shifts: Array(31).fill("") },
        { name: "Миронов С.А.", shifts: Array(31).fill("") },
        { name: "Куштанов К.А.", shifts: Array(31).fill("") },
        { name: "Сучков Д.В.", shifts: Array(31).fill("") },
        { name: "Рыжих И.Н.", shifts: Array(31).fill("") },
        { name: "Бондаренко Т.А.", shifts: Array(31).fill("") }
    ],
    "Ноябрь": [
        { name: "Лагутенков Р.С.", shifts: Array(30).fill("") },
        { name: "Миронов С.А.", shifts: Array(30).fill("") },
        { name: "Куштанов К.А.", shifts: Array(30).fill("") },
        { name: "Сучков Д.В.", shifts: Array(30).fill("") },
        { name: "Рыжих И.Н.", shifts: Array(30).fill("") },
        { name: "Бондаренко Т.А.", shifts: Array(30).fill("") }
    ],
    "Декабрь": [
        { name: "Лагутенков Р.С.", shifts: Array(31).fill("") },
        { name: "Миронов С.А.", shifts: Array(31).fill("") },
        { name: "Куштанов К.А.", shifts: Array(31).fill("") },
        { name: "Сучков Д.В.", shifts: Array(31).fill("") },
        { name: "Рыжих И.Н.", shifts: Array(31).fill("") },
        { name: "Бондаренко Т.А.", shifts: Array(31).fill("") }
    ]
};