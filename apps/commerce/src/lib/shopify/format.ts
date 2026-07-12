export const formatShopifyPrice = ({
  amount,
  currencyCode,
}: {
  amount: string;
  currencyCode: string;
}) =>
  new Intl.NumberFormat("en", {
    style: "currency",
    currency: currencyCode,
  }).format(Number(amount));

export const formatShopifyPriceRange = ({
  min,
  max,
}: {
  min: {
    amount: string;
    currencyCode: string;
  };
  max: {
    amount: string;
    currencyCode: string;
  };
}) => {
  const formattedMin = formatShopifyPrice(min);
  const formattedMax = formatShopifyPrice(max);

  return min.amount === max.amount && min.currencyCode === max.currencyCode
    ? formattedMin
    : `${formattedMin} - ${formattedMax}`;
};
