import React, { Component } from "react";
import ScreenTypes from "../navigators/ScreenTypes";
import { View, Text, Image, TouchableOpacity } from "@shoutem/ui";
import Pagination from "../components/Pagination";
import { FlatList, ScrollView, Dimensions } from "react-native";
import Loading from "../components/Loading";
import { Pages } from "react-native-pages";
import HeroStatRowProMatch, {
  HERO_STAT_ROW_HEIGHT
} from "../components/HeroStatRowProMatch";

import { createGroupedArray, round } from "../utils/utilsFunction";

import themeColors from "../themes/colors";
import * as heroStatActions from "../actions/HeroStatAction";
import { navigateToMenuScreen, setParams } from "../actions/NavigationAction";
import { sendHeroData } from "../actions/HeroOverviewActions";
import { connectStyle } from "@shoutem/theme";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { getHeroImage } from "../utils/getHeroImage";
import kFormatter from "../utils/kFormatter";

class HeroStatProfessional extends Component {
  constructor(props) {
    super(props);

    let screenHeight = Dimensions.get("window").height;

    this.state = {
      screenHeight,
      heroStats: [],
      totalProMatches: "",
      refreshing: false,
      currentIndex: 0,
      sortedColumn: "id",
      ascending: true
    };

    this.renderItem = this.renderItem.bind(this);
    this.onRefresh = this.onRefresh.bind(this);
    this.onPage = this.onPage.bind(this);
    this.renderFooter = this.renderFooter.bind(this);
    this.keyExtractor = this.keyExtractor.bind(this);
    this.sortHero = this.sortStat.bind(this, "name");
    this.sortPick = this.sortStat.bind(this, "pick");
    this.sortBan = this.sortStat.bind(this, "ban");
    this.sortWin = this.sortStat.bind(this, "win");
    this.onPressRow = this.onPressRow.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.heroStats != nextProps.heroStats) {
      const matchCountPro = this.calculateTotalProMatches(nextProps.heroStats);
      const heroStats = this.processHeroStatsProMatch(
        nextProps.heroStats,
        matchCountPro
      );
      this.setState({
        heroStats: createGroupedArray(heroStats, 20),
        totalProMatches: matchCountPro
      });
    }
  }

  componentDidMount() {
    this.props.actions.fetchHeroStats();
  }

  calculateTotalProMatches(heroStats) {
    let sum = (a, b) => a + b;

    const matchCountPro =
      heroStats.map(heroStat => heroStat.pro_pick || 0).reduce(sum, 0) / 10;

    return matchCountPro;
  }

  processHeroStatsProMatch(heroStats, matchCountPro) {
    let processedData = [];

    for (let i = 0; i < heroStats.length; i++) {
      let processedStat = {
        heroData: {}
      };
      const heroStat = heroStats[i];

      processedStat.id = heroStat["id"];
      processedStat.heroImg = getHeroImage(heroStat["id"]);
      let heroName = heroStat["localized_name"];
      if (heroName.length > 9) heroName = heroName.substring(0, 6) + "...";
      processedStat.heroName = heroName;
      const proPick = heroStat["pro_pick"] || 0;
      processedStat.proP_Matches = proPick;
      processedStat.proP_Percent = round(proPick / matchCountPro * 100, 1);

      const proBan = heroStat["pro_ban"] || 0;
      processedStat.proB_Matches = proBan;
      processedStat.proB_Percent = round(proBan / matchCountPro * 100, 1);

      const totalMatchesProBP = proPick + proBan;
      processedStat.proBP_Matches = totalMatchesProBP;
      processedStat.proBP_Percent = round(
        totalMatchesProBP / matchCountPro * 100,
        1
      );

      const proWin = heroStat["pro_win"] || 0;
      processedStat.proW_Matches = proWin;
      processedStat.proW_Percent = !heroStat["pro_win"]
        ? 0
        : round(proWin / proPick * 100, 1);

      //hero data
      processedStat.heroData.heroId = heroStat["id"];
      processedStat.heroData.name = heroStat["localized_name"];
      processedStat.heroData.primaryAttribute = heroStat["primary_attr"];
      processedStat.heroData.attackType = heroStat["attack_type"];
      processedStat.heroData.roles = heroStat["roles"].join(", ");
      processedStat.heroData.img = getHeroImage(heroStat["id"]);
      processedStat.heroData.baseHealth = heroStat["base_health"];
      processedStat.heroData.baseHealthRegen = heroStat["base_health_regen"];
      processedStat.heroData.baseMana = heroStat["base_mana"];
      processedStat.heroData.baseManaRegen = heroStat["base_mana_regen"];
      processedStat.heroData.baseArmor = heroStat["base_armor"];
      processedStat.heroData.baseMR = heroStat["base_mr"];
      processedStat.heroData.baseAttackMin = heroStat["base_attack_min"];
      processedStat.heroData.baseAttackMax = heroStat["base_attack_max"];
      processedStat.heroData.baseStr = heroStat["base_str"];
      processedStat.heroData.baseAgi = heroStat["base_agi"];
      processedStat.heroData.baseInt = heroStat["base_int"];
      processedStat.heroData.strGain = heroStat["str_gain"];
      processedStat.heroData.agiGain = heroStat["agi_gain"];
      processedStat.heroData.intGain = heroStat["int_gain"];
      processedStat.heroData.attackRange = heroStat["attack_range"];
      processedStat.heroData.projectileSpeed = heroStat["projectile_speed"];
      processedStat.heroData.attackRate = heroStat["attack_rate"];
      processedStat.heroData.moveSpeed = heroStat["move_speed"];
      processedStat.heroData.turnRate = heroStat["turn_rate"];
      processedStat.heroData.cmEnabled = heroStat["cm_enabled"];

      processedData[i] = processedStat;
    }

    return processedData;
  }

  onPressRow(heroId) {
    this.props.navigation.dispatch(
      navigateToMenuScreen(ScreenTypes.HeroOverview, { heroId })
    );

    this.props.navigation.dispatch(
      setParams({ heroId: heroId }, ScreenTypes.HeroRanking)
    );
  }

  renderItem({ item, index }) {
    return (
      <HeroStatRowProMatch
        heroStat={item}
        index={index}
        onPress={() => this.onPressRow(item.heroData.heroId)}
      />
    );
  }

  getItemLayout(data, index) {
    return {
      offset: HERO_STAT_ROW_HEIGHT * index,
      length: HERO_STAT_ROW_HEIGHT,
      index
    };
  }

  onRefresh() {}

  onPage(index) {
    this.setState({ currentIndex: index });
  }

  renderFooter() {
    const { currentIndex } = this.state;
    const totalPages = this.state.heroStats.length;

    return (
      <Pagination
        totalPages={totalPages}
        currentIndex={currentIndex}
        numberPagesShow={5}
        onPage={this.onPage}
      />
    );
  }

  keyExtractor(item, index) {
    return item.id;
  }

  sortByHeroName(a, b) {
    var nameA = a.heroName.toUpperCase();
    var nameB = b.heroName.toUpperCase();

    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }

    return 0;
  }

  sortByStat(field) {
    return (a, b) => {
      if (a[field] < b[field]) {
        return -1;
      } else if (a[field] > [field]) {
        return -1;
      } else {
        this.sortByHeroName(a, b);
      }
    };
  }

  sortStat(column) {
    let { ascending, sortedColumn, heroStats, ungroupedHeroStats } = this.state;
    let sortField = "",
      isAscending = true,
      sortedStat = [],
      sortCriteria = {};

    if (column == sortedColumn) {
      isAscending = !ascending;

      const flattened = heroStats.reduce((a, b) => {
        return a.concat(b);
      });

      const reverse = flattened.reverse();
      heroStats = createGroupedArray(reverse, 20);

      this.setState({
        ascending: isAscending,
        heroStats
      });
    } else {
      if (column == "name") {
        sortField = "heroName ";
        sortCriteria = this.sortByHeroName;
      } else if (column == "pick") {
        sortField = "proP_Percent";
        sortCriteria = this.sortByStat(sortField);
      } else if (column == "ban") {
        sortField = "proB_Percent";
        sortCriteria = this.sortByStat(sortField);
      } else if (column == "win") {
        sortField = "proW_Percent";
        sortCriteria = this.sortByStat(sortField);
      }

      const flattened = heroStats.reduce((a, b) => {
        return a.concat(b);
      });
      const sorted = createGroupedArray(flattened.sort(sortCriteria), 20);
      heroStats = sorted;

      this.setState({
        sortedColumn: column,
        heroStats
      });
    }
  }

  render() {
    const styles = this.props.style;
    const { navigation } = this.props;
    const { isLoadingHeroStats } = this.props;
    const {
      currentIndex,
      heroStats,
      totalProMatches,
      screenHeight
    } = this.state;

    let content = <View styleName="fill-parent dota2" />;

    if (isLoadingHeroStats) {
      content = (
        <View styleName="fill-parent dota2">
          <Loading />
        </View>
      );
    } else if (heroStats.length > 0) {
      content = (
        <ScrollView style={styles.container}>
          <Text style={{ color: "#fff", alignSelf: "center", marginBottom: 5 }}>
            {totalProMatches} matches in last 30 days
          </Text>
          <View style={{ flex: 1, height: screenHeight, paddingBottom: 10 }}>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity onPress={this.sortHero}>
                  <Text style={{ color: "#fff", marginRight: 5 }}>HERO</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <TouchableOpacity onPress={this.sortPick}>
                  <Text style={{ color: "#fff", marginRight: 5 }}>PICK%</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <TouchableOpacity onPress={this.sortBan}>
                  <Text style={{ color: "#fff", marginRight: 5 }}>BAN%</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <TouchableOpacity onPress={this.sortWin}>
                  <Text style={{ color: "#fff", marginRight: 5 }}>WIN%</Text>
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              data={heroStats[currentIndex]}
              renderItem={this.renderItem}
              getItemLayout={this.getItemLayout}
              ListFooterComponent={this.renderFooter}
              keyExtractor={this.keyExtractor}
              initialNumToRender={10}
            />
          </View>
        </ScrollView>
      );
    }

    return content;
  }
}

HeroStatProfessional.navigationOptions = {
  title: "Stats Pro Matches",
  tabBarLabel: "Professional"
};

const styles = {
  container: {
    paddingBottom: 10,
    paddingTop: 10,
    paddingLeft: 15,
    paddingRight: 15,
    backgroundColor: "#2e2d45"
  },
  header: {
    flex: 1,
    paddingLeft: 5,
    paddingRight: 5,
    flexDirection: "row",
    alignItems: "center",
    maxHeight: 40,
    backgroundColor: "rgba(0,0,0,0.3)"
  }
};

function mapStateToProps(state) {
  return {
    isLoadingHeroStats: state.heroStatsState.isLoadingHeroStats,
    isEmptyHeroStats: state.heroStatsState.isEmptyHeroStats,
    heroStats: state.heroStatsState.heroStats
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(heroStatActions, dispatch),
    sendHeroData: heroData => dispatch(sendHeroData(heroData))
  };
}

export default connectStyle("dota2app.HeroProfessionalScreen", styles)(
  connect(mapStateToProps, mapDispatchToProps)(HeroStatProfessional)
);
