const xl = require("excel4node");

// Excel config
const wb = new xl.Workbook();
const nifty = wb.addWorksheet("Dying Soon");

const titleStyle = wb.createStyle({
  font: {
    bold: true,
    color: "#FF0800",
    size: 12,
  },
});

nifty.cell(1, 1).string("ID").style(titleStyle);
nifty.cell(1, 2).string("Level").style(titleStyle);
nifty.cell(1, 3).string("Time until Death").style(titleStyle);
nifty.cell(1, 4).string("Score").style(titleStyle);

nifty.column(1).setWidth(15);
nifty.column(2).setWidth(15);
nifty.column(3).setWidth(20);
nifty.column(4).setWidth(15);

const log = async (id, level, timeUntil, score, row) => {
  nifty.cell(row, 1).number(Number(id));
  nifty.cell(row, 2).number(Number(level));
  nifty.cell(row, 3).number(Number(timeUntil));
  nifty.cell(row, 4).number(Number(score));

  wb.write(`Logs.xlsx`);
};

module.exports = log;
