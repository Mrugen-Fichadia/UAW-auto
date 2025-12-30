import React from 'react';
import {
    View,
    Image,
    StyleSheet,
    TouchableOpacity,
    Platform,
    Text,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigationState } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Octicons from 'react-native-vector-icons/Octicons';
import { appColors } from '../component/Color';

// Screens
import Home from '../screen/Home/Home';
import Profile from '../screen/Profile/Profile';
import Cart from '../screen/Cart/Cart';

const Bottom = createBottomTabNavigator();
const CustomTabBarButton = ({ children, onPress }) => {
    const navigationState = useNavigationState(state => state);
    const focused = navigationState?.routes[navigationState?.index]?.name === 'Cart';

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.9}
            style={styles.customButtonContainer}
        >
            <View style={[styles.customButton, focused && styles.customButtonFocused]}>
                {children}
            </View>
            <Text style={{
                color: focused ? appColors.primary : appColors.fontColor,
                fontSize: 11,
                fontWeight: "600",
                fontFamily: 'Exo2-Bold',
            }}>
                Cart
            </Text>
        </TouchableOpacity>
    );
};

const getScreenOptions = (title, navigation, backScreen = null, customHeaderHeight = 100) => ({
    headerShown: true,
    headerStyle: {
        backgroundColor: appColors.offWhite,
        height: customHeaderHeight,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: 'hidden',
    },
    headerTintColor: '#fff',
    headerTitleAlign: 'center',
    // headerLeft: () => (
    //     <View style={styles.headerLeftContainer}>
    //         <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
    //             <Octicons name="table" size={24} color={appColors.secondary} />
    //         </TouchableOpacity>
    //     </View>
    // ),
    // headerRight: () => (
    //     <View style={styles.headerRightContainer}>
    //         <TouchableOpacity>
    //             <Octicons name="bell" size={24} color={appColors.secondary} />
    //         </TouchableOpacity>



    //     </View>
    // ),
    headerTitle: () => (
        <View style={styles.headerLeftContainer}>
            <TouchableOpacity>
                <Image
                    source={
                        require('../assets/images/logo.png')
                    }
                    resizeMode='contain'
                    style={styles.avatar}
                />
            </TouchableOpacity>
        </View>
    ),

});

const BottomNavigator = () => {
    return (
        <Bottom.Navigator
            initialRouteName="Home"
            screenOptions={{
                tabBarLabelStyle: { fontSize: 11, fontFamily: 'Exo2-Bold' },
                tabBarActiveTintColor: appColors.primary,
                tabBarInactiveTintColor: appColors.fontColor,
                tabBarStyle: styles.tabBar,
                headerShown: false,
            }}
        >
            <Bottom.Screen
                name="Home"
                component={Home}
                options={({ navigation }) => ({
                    ...getScreenOptions('Home', navigation),
                    tabBarIcon: ({ focused }) => (
                        <Feather name="home" size={20} color={focused ? appColors.primary : appColors.fontColor} />
                    ),
                })}
            />

            <Bottom.Screen
                name="Cart"
                component={Cart}
                options={({ navigation }) => ({
                    ...getScreenOptions('Cart', navigation),
                    tabBarIcon: ({ focused }) => (
                        <Feather name="shopping-cart" size={28} color={focused ? '#fff' : appColors.fontColor} />
                    ),
                    tabBarButton: (props) => <CustomTabBarButton {...props} />,
                    tabBarLabel: () => null,
                })}
            />


            <Bottom.Screen
                name="Profile"
                component={Profile}
                options={({ navigation }) => ({
                    ...getScreenOptions('Profile', navigation),
                    tabBarIcon: ({ focused }) => (
                        <FontAwesome name="user" size={22} color={focused ? appColors.primary : appColors.fontColor} />
                    ),
                })}
            />


        </Bottom.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        height: 60,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 10,
        paddingBottom: 5,
    },
    customButtonContainer: {
        top: -30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    customButton: {
        width: 60,
        height: 60,
        borderRadius: 35,
        backgroundColor: appColors.white,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        marginBottom: 8
    },
    customButtonFocused: {
        backgroundColor: appColors.primary, // Red background when focused
    },
    plusIcon: {
        textAlign: 'center',
        textAlignVertical: 'center',
        alignSelf: 'center',
    },
    headerLeftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        justifyContent: 'flex-start',
        paddingLeft: 10,
    },
    headerRightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        justifyContent: 'flex-start',
        paddingRight: 15,
    },

    headerTitle: { textAlign: 'center', fontWeight: '500', color: appColors.primary, fontSize: 15 },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 20,
    },
});

export default BottomNavigator;