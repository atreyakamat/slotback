import { Alert, View } from "react-native";
import { Badge, Button, Card, Divider, Row, Screen, Text } from "@/components/ui";
import { useSignedIn } from "@/lib/session";
import { space } from "@/theme";

const ROLE = { OWNER: "Owner", ADMIN: "Admin", STAFF: "Staff" } as const;

export default function More() {
  const { me, session, signOut } = useSignedIn();
  return (
    <Screen>
      <Card>
        <Text variant="title">{me.business.name}</Text>
        <Text tone="muted">{me.location.name}</Text>
        {me.business.isDemo ? (
          <View style={{ marginTop: space(2) }}>
            <Badge label="Demo: nothing messages a real person" tone="warning" />
          </View>
        ) : null}
        <Divider />
        <Row style={{ justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Text>{me.user.name}</Text>
            <Text tone="muted" variant="small">
              {me.user.email}
            </Text>
          </View>
          <Badge label={ROLE[me.role]} />
        </Row>
      </Card>
      <Card>
        <Text style={{ fontWeight: "700" }}>Settings live on the web</Text>
        <Text tone="muted" style={{ marginTop: space(1) }}>
          Change hours, services, offer rules and your team at {session.server.replace(/^https?:\/\//, "")}.
        </Text>
      </Card>
      <Button
        label="Sign out of this phone"
        variant="danger"
        onPress={() =>
          Alert.alert("Sign out?", "You'll need to scan a new QR code to sign back in.", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign out", style: "destructive", onPress: () => signOut() },
          ])
        }
      />
      <Text tone="muted" variant="small" style={{ textAlign: "center" }}>
        SlotBack staff app 0.1
      </Text>
    </Screen>
  );
}
