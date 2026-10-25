import { getFormatter, getTranslations } from "next-intl/server";

import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import { GallerySection } from "./gallery-section";
import { sampleOrders, statusVariant } from "./sample-orders";

export async function TableShowcase() {
  const t = await getTranslations("common.devGallery.table");

  return (
    <GallerySection title={t("title")} description={t("description")}>
      <Card>
        <CardContent>
          <OrdersTable />
        </CardContent>
      </Card>
    </GallerySection>
  );
}

async function OrdersTable() {
  const t = await getTranslations("common.devGallery.table");

  return (
    <Table>
      <TableCaption>{t("caption")}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>{t("order")}</TableHead>
          <TableHead>{t("customer")}</TableHead>
          <TableHead>{t("status")}</TableHead>
          <TableHead className="text-right">{t("total")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleOrders.map((order) => (
          <OrderRow key={order.number} order={order} />
        ))}
      </TableBody>
    </Table>
  );
}

async function OrderRow({ order }: { order: (typeof sampleOrders)[number] }) {
  const t = await getTranslations("common.devGallery.badges");
  const format = await getFormatter();
  const total = format.number(order.total, {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  });

  return (
    <TableRow>
      <TableCell className="font-medium">{order.number}</TableCell>
      <TableCell>{order.customer}</TableCell>
      <TableCell>
        <Badge variant={statusVariant[order.status]}>{t(order.status)}</Badge>
      </TableCell>
      <TableCell className="text-right tabular-nums">{total}</TableCell>
    </TableRow>
  );
}
