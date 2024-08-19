const { queryCustom } = require("../helpers/query");

async function getPaginatedData(
  tableName,
  currentPage = 1,
  itemsPerPage = 1000,
  whereCond = null,
  columnOrderDesc = null
) {
  try {
    const offset = (currentPage - 1) * itemsPerPage;

    // Fetch total count
    const totalCountResult = await queryCustom(
      `SELECT COUNT(*) FROM ${tableName}`
    );
    const totalCount = parseInt(totalCountResult.rows[0].count, itemsPerPage);

    // Fetch paginated data
    const dataResult = await queryCustom(
      `
            SELECT ROW_NUMBER() OVER (
                ${columnOrderDesc ? `ORDER BY ${columnOrderDesc} DESC` : ""}
            ) as no, 
            * FROM ${tableName}
            ${whereCond ? `WHERE ${whereCond}` : ""}
            ${columnOrderDesc ? `ORDER BY ${columnOrderDesc} DESC` : ""}
            ${itemsPerPage ? `LIMIT ${itemsPerPage} OFFSET ${offset}` : ""}`
    );

    return {
      data: dataResult.rows,
      meta: {
        totalData: totalCount,
        currentPage: Number(currentPage),
        itemsPerPage: Number(itemsPerPage),
        totalPages: Math.ceil(totalCount / itemsPerPage),
      },
    };
  } catch (err) {
    console.error("Error fetching paginated data:", err);
    throw err;
  }
}

module.exports = getPaginatedData;
