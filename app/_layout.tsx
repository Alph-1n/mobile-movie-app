import { Stack } from "expo-router";
import './globals.css';
import { StackScreen } from "react-native-screens";

export default function RootLayout() {
  return <Stack>
    <Stack.Screen 
     name="(tabs)"
     options={{headerShown: false}
    }/>
    <Stack.Screen
      name="movies/[id]"
      options={{headerShown: false}}/>
  </Stack>;
}
