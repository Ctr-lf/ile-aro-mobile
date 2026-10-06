import { View } from "react-native";
import { router, Stack } from "expo-router";
import { Compass } from "lucide-react-native";
import { EmptyState } from "@/components/Layout";

export default function NotFound() {
  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <Stack.Screen options={{ title: "Not found" }} />
      <EmptyState
        icon={Compass}
        title="This cloth has wandered off"
        text="The page you were looking for is not here."
        actionLabel="Back to the shop"
        onAction={() => router.replace("/")}
      />
    </View>
  );
}
