/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет прибыли от операции

  const { discount, sale_price, quantity } = purchase;
  if (!purchase) {
    throw new Error("Чего-то не хватает");
  }
  if (typeof purchase !== "object") {
    throw new Error("Не был сформирован объект c чеками!");
  }
  const discountRate = 1 - discount / 100;
  return sale_price * quantity * discountRate;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const { profit } = seller;

  if ((!index || !total || !seller) && (index && total) !== 0) {
    throw new Error("Чего-то не хватает");
  }

  if (typeof seller !== "object") {
    throw new Error("Не был сформирован объект с продавцами!");
  }
  if (index === 0) {
    return 0.15 * profit
  } else if (index === 1 || index === 2) {
      return 0.1 * profit
  } else if (index === total - 1) {
      return 0;
  } else { // Для всех остальных
      return profit * 0.05;
  } 
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  const { calculateRevenue, calculateBonus } = options;

  if (typeof options !== "object") {
    throw new Error("Не был сформирован объект функций!");
  }
  
  if (!data.purchase_records || data.purchase_records.length === 0) {
    throw new Error("Массив с чеками пуст!");
  }

  if (
    typeof calculateBonus !== "function" ||
    typeof calculateRevenue !== "function"
  ) {
    throw new Error("Вы передаете не функции!");
  }

  // @TODO: Проверка наличия опций

  if (!data || !options) {
    throw new Error("Чего-то не хватает");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики

  const sellerStats = data.sellers.map((seller) => {
    return {
      id: seller.id,
      name: `${seller.first_name} ${seller.last_name}`,
      revenue: 0,
      profit: 0,
      sales_count: 0,
      products_sold: {},
    };
  });

  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const sellerIndex = Object.fromEntries(
    sellerStats.map((item) => [item.id, item])
  );
  const productIndex = Object.fromEntries(
    data.products.map((item) => [item["sku"], item])
  );

  // @TODO: Расчет выручки и прибыли для каждого продавца

  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];

    seller.sales_count += 1;
    seller.revenue += record.total_amount;

    record.items.forEach((item) => {
      const product = productIndex[item.sku]; // Товар
      const cost = product.purchase_price * item.quantity; // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
      const revenue = calculateRevenue(item); // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
      const profit = revenue - cost; // Посчитать прибыль: выручка минус себестоимость
      seller.profit += profit; // Увеличить общую накопленную прибыль (profit) у продавца

      // Учёт количества проданных товаров
      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += 1; // По артикулу товара увеличить его проданное количество у продавца
    });
  });

  // @TODO: Сортировка продавцов по прибыли
  sellerStats.sort((a, b) => {
    return b.profit - a.profit;
  });

  // @TODO: Назначение премий на основе ранжирования

  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerStats.length, seller);
    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => {
        return b.quantity - a.quantity;
      })
      .slice(0, 10);
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями

  return sellerStats.map((seller) => ({
    seller_id: seller.id,
    name: seller.name,
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2),
  }));
}
