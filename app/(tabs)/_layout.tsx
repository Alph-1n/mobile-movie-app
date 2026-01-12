import { Tabs } from "expo-router";
import { ImageBackground, Image, Text, View } from "react-native";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";

// TabIcon component - handles focused and unfocused tab states
function TabIcon({ focused, icon, title }: any) {
  if (focused) {
    // Active tab - shows icon + label with background
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ImageBackground
          source={images.highlight}
          style={{ 
            flexDirection: 'row', 
            paddingHorizontal: 16, 
            paddingVertical: 8,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 20,
            minHeight: 40
          }}
          resizeMode="contain"
        >
          <Image 
            source={icon} 
            tintColor="#151312" 
            style={{ width: 20, height: 20 }} 
            resizeMode="contain"
          />
          <Text style={{ 
            color: '#151312', 
            fontSize: 14, 
            fontWeight: '600', 
            marginLeft: 8 
          }}>
            {title}
          </Text>
        </ImageBackground>
      </View>
    );
  }

  // Inactive tab - shows only icon
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: 40 }}>
      <Image 
        source={icon} 
        tintColor="#A8B5DB" 
        style={{ width: 20, height: 20 }} 
        resizeMode="contain"
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false, // Hide default labels (using custom TabIcon instead)
        tabBarStyle: {
          backgroundColor: "#0F0D23", // Dark background
          borderRadius: 50, // Rounded corners
          marginHorizontal: 20, // Space from screen edges
          marginBottom: 36, // Space from bottom
          height: 52, // Fixed height
          position: "absolute", // Float above content
          overflow: "hidden", // Clip content to rounded corners
          borderWidth: 1,
          borderColor: "#0F0D23",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-around", // Evenly space tabs
          alignItems: "center", // Vertically center icons
          paddingHorizontal: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false, // Hide header
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.home} title="Home" />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.search} title="Search" />
          ),
        }}
      />

      <Tabs.Screen
        name="saved"
        options={{
          title: "Save",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.save} title="Save" />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.person} title="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}