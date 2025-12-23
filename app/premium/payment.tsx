import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/ui/text";

export default function Payment() {
  const { t } = useTranslation('premium');

  return (
    <View>
      <Text>{t('placeholders.payment')}</Text>
    </View>
  );
}
