/*
 * stryker.com shared Experience Fragments → EDS fragment documents (#443).
 *
 * Key: the XF path exactly as in the customer's "Experience Fragment References" export
 * (no .html). Every importer resolves XF references through this map (xf-fragment-path.js):
 * a listed XF is a shared fragment, and its EDS document path follows from the XF path
 * (rule in xf-fragment-path.js), or `fragment` when the document lives elsewhere; an XF that
 * is not listed is imported inline. Add an entry when a new shared XF is found (e.g. from
 * the site-wide export).
 *
 * Source: Experience Fragment References export (news-detail pages), received 2026-10-25.
 * xf-fragment-map.json is a JSON copy for tools that cannot import JS; keep it in sync
 * (node tools/importer/xf-fragment-path.test.mjs checks it).
 */
export default {
  '/content/experience-fragments/stryker/acute-care/en/business_unit/footer-links/master': {
    name: 'Acute Care "Resources" links',
  },
  '/content/experience-fragments/stryker/emergency-care/en/business_unit/footer/master': {
    name: 'Emergency Care "Resources" links',
  },
  '/content/experience-fragments/stryker/sage/en/footer/footer/master': {
    name: 'Sage "Resources" links',
  },
  '/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/header/master': {
    name: 'Sustainability "Connect with us" band (above the form)',
  },
  '/content/experience-fragments/stryker/sustainability-solutions/en/contact_information/contact/master': {
    name: 'Sustainability contact aside (next to the form)',
  },
  '/content/experience-fragments/stryker/sage/en/business_unit/social-icons/master': {
    name: 'Sage contact aside (LinkedIn / Facebook icons)',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/advancing_healthcare/join-our-talent-network/join-our-talent-network-v2-desktop': {
    name: '"Join our talent network" banner (carousel slide; mobile slide: …/join-our-talent-network-v2-mobile1)',
  },
  '/content/experience-fragments/stryker/corporate/en/about/our_management/back-button/master': {
    name: 'Our management "◁ Back" link (leader bio pages)',
  },
  '/content/experience-fragments/stryker/corporate/en/about/our_board_of_directo/back-button/master': {
    name: 'Board of directors "◁ Back" link (director bio pages)',
  },
  // an article body kept as its own fragment document (the page's Fragment block)
  '/content/experience-fragments/stryker/surgical-technologies/en/news/technology-helps-imp/body-copy/master': {
    name: 'Article body of "Technology helps improve colonoscopy safety and efficiency"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/stryker-boosts-innovation-r-and-d-expands-with-medical-device-testing-facility/body-copy/master': {
    name: 'Article body of "Stryker boosts innovation: R&D expands with medical device testing facility"',
  },
  '/content/experience-fragments/stryker/emergency-care/en/news/why-all-police-cars-need-aeds/body': {
    name: 'Article body of "Why all police cars need an AED"',
  },
  '/content/experience-fragments/stryker/emergency-care/en/news/understanding-the-basics-of-a-lucas-chest-compression-system/body': {
    name: 'Article body of "Understanding the basics of a LUCAS chest compression system"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/features/_80_years_together/test---body-copy/master': {
    name: 'Article body of "80 years together"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/employees_share_why_/body-copy/master': {
    name: 'Article body of "Employees share why DE&I matters at annual Summit"',
  },
  '/content/experience-fragments/stryker/communications/en/news/_2025/what-does-an-operating-room-look-like-look-inside-strykers-isuite/body-copy/master': {
    name: 'Article body of "What does an operating room look like? Look inside Stryker’s iSuite"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/features/breast_cancer_awaren/body-copy/master': {
    name: 'Article body of "Breast Cancer Awareness Meets Breast Cancer Advancements"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/features/breast_cancer_awaren/body-copy-2/master': {
    name: 'Article body (second part) of "Breast Cancer Awareness Meets Breast Cancer Advancements"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/features/putting_people_first/body-copy/master': {
    name: 'Article body of "Putting people first: how Stryker supports worldwide disaster relief efforts"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/features/mako_smartrobotics_h/body-text/master': {
    name: 'Article body of "Mako SmartRobotics™ hits 500,000+ procedures"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/features/mother_and_son_take_/body-copy/master': {
    name: 'Article body of "Mother and son take on Goldenhar syndrome"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/features/some_people_say_they/body-copy/master': {
    name: 'Article body of "Some people say they’d give you their kidney. This nurse meant it."',
  },
  '/content/experience-fragments/stryker/corporate/en/patient/jordan_3_17_23/jordan/master': {
    name: 'Article body of "Celebrating four years | Jordan’s sudden cardiac arrest story"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/springing_into_actio/body-copy/master': {
    name: 'Article body of "Springing into action | Andy’s sudden cardiac arrest story"',
  },
  '/content/experience-fragments/stryker/corporate/en/patient/boris_story_5_15_23/news-content/master': {
    name: 'Article body of "Taking action | Boris’ stroke story"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/katherine_s_catastro/body-copy/master': {
    name: 'Article body of "Katherine’s catastrophic stroke survivor story"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/defying_the_odds/body-content/master': {
    name: 'Article body of "Defying the odds"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/woman_holding_recycl/body-copy/master': {
    name: 'Article body of "Packaging for a better planet"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/why_aeds_belong_on_b/body-copy/master': {
    name: 'Article body of "Why AEDs belong on back-to-school checklists"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/restoring_form_funct/body/master': {
    name: 'Article body of "Restoring form, function and hope | Emily’s jaw replacement"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/features/is_it_a_heart_attack/body-copy/master': {
    name: 'Article body of "Is it a heart attack or sudden cardiac arrest? Know the warning signs and what to do for both"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/carolyn_s_mako_total/body-copy/master': {
    name: 'Article body of "Carolyn’s Mako Total Hip surgery story"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/focusing_on_her_mobi/body-copy/master': {
    name: 'Article body of "How Janet  recovered from a vertebral (spine) compression fracture"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/three_things_to_know/body-copy/master': {
    name: 'Article body of "Three things to know about Stryker’s employee giving program"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/tour_the_amsterdam_s/body-copy/master': {
    name: 'Article body of "Tour the Amsterdam Skills Centre, an international training centre for medical specialists"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/features/stryker_donates_22_5/text/text/master': {
    name: 'Article body of "Stryker donates 22,500 Emergency Relief Bed Kits to Project C.U.R.E."',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/what_are_the_symptom/body-copy/master': {
    name: 'Article body of "What are the symptoms and signs of stroke?"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/a_partnership_promot/body-copy/master': {
    name: 'Article body of "A partnership promoting mental health for healthcare workers"',
  },
  '/content/experience-fragments/stryker/emergency-care/en/news/help-increase-patient-outcomes-both-in-and-out-of-the-hospital/body': {
    name: 'Article body of "Help increase patient outcomes both in and out of the hospital"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/these_nurses_share_h/body-copy/master1': {
    name: 'Article body of "Nurses working at Stryker share how their experience becomes innovation in nursing"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/transforming_confide/body-copy/master': {
    name: 'Article body of "Stryker and Operation Smile transform confidence and care"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/celebrating_hispanic/body-copy/master': {
    name: 'Article body of "Celebrating Hispanic Heritage: driving our mission forward"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/mako_robotics_drivin/infographic-text/master': {
    name: 'Article body of "Mako: Robotics driving innovation across specialties"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/military_members_on_/body-copy/master11': {
    name: 'Article body of "Military members on a mission to make healthcare better"',
  },
  '/content/experience-fragments/stryker/surgical-technologies/en/news/the_journey_to_zero_/body-copy/master': {
    name: 'Article body of "The “Journey to Zero Harm” Starts with Communication, Protocols and Technology"',
  },
  '/content/experience-fragments/stryker/surgical-technologies/en/news/protect_your_patient/body-copy/master': {
    name: 'Article body of "Protect your patients … and your OR staff."',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/a_safe_space_at_stry/body-copy/master': {
    name: 'Article body of "A safe space at Stryker"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/back_pain_and_scolio/body-copy/master': {
    name: 'Article body of "Back pain and scoliosis: Victoria finds relief"',
  },
  '/content/experience-fragments/stryker/corporate/en/patient/derrick_10_2_23/derrick/master': {
    name: 'Article body of "Knowing the warning signs of sudden cardiac arrest helped saved his life | Derrick’s sudden cardiac arrest story"',
  },
  '/content/experience-fragments/stryker/emergency-care/en/news/when-to-use-and-aed/body': {
    name: 'Article body of "Knowing when to use an AED: CPR and AED guidelines for sudden cardiac arrest"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/how_stryker_is_innov/body-copy/master': {
    name: 'Article body of "How Stryker is innovating in operating room design"',
  },
  '/content/experience-fragments/stryker/surgical-technologies/en/news/how_technology_helps/how-technology-helps-address-gi-suite-challenges/master': {
    name: 'Article body of "How Technology Helps Address GI Suite Challenges"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/stryker_s_global_vol/body/master': {
    name: 'Article body of "Stryker’s Global Volunteer Network highlights importance of volunteerism"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/five_things_you_need/body-copy/master': {
    name: 'Article body of "Five things you need to know about high blood pressure and stroke"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/promoting_high_quali/body-copy/master': {
    name: 'Article body of "Promoting high quality, inclusive healthcare in Latin America"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/-2026/features/myths-realities-and-real-innovation-what-everyone-should-know-about-arthritis/myths--realities-and-real-innovation--what-everyone-should-know/master': {
    name: 'Article body of "Myths, realities and real innovation: What everyone should know about arthritis"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/advancing_healthcare/body-copy/master': {
    name: 'Article body of "Advancing healthcare professionals’ education with Stryker’s Neurotech Mobile Experience"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/stryker_is_doubling_/body-text/master': {
    name: 'Article body of "Advancing neurosurgery: Stryker supports brain tumor research through ongoing partnership"',
  },
  '/content/experience-fragments/stryker/emergency-care/en/news/3-ways-aed-remote-monitoring-makes-a-difference/blog': {
    name: 'Article body of "3 ways AED remote monitoring makes a difference"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/stryker_gets_medical/2-8-24-body-copy/master': {
    name: 'Article body of "Stryker gets medical equipment to regions in need with Project C.U.R.E. partnership"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/women_leading_the_ch/body/master': {
    name: 'Article body of "Women leading the charge for change"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/a_building_well_done/body/master': {
    name: 'Article body of "A building WELL done | Earning Platinum for putting people first"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/features/nurses_a_key_driver_/body-content/master': {
    name: 'Article body of "Nurses: A key driver in advancing global health"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/this_surgical_icu_te/this-surgical-icu-team-is-bound-by-unspeakable-trauma-and-miracu/master': {
    name: 'Article body of "This Surgical ICU team is bound by unspeakable trauma and miraculous healings"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/features/caregiver_klisa/body-copy/master': {
    name: 'Article body of "This nurse turned tragic loss into inspiring hope"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/strykers_journey_to_/infographic/master': {
    name: 'Article body of "Stryker’s Journey to Zero* harm continues with Neptune S"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/three_ways_stryker_w/body/master': {
    name: 'Article body of "Three ways Stryker supports physicians in their pursuit of better patient outcomes"',
  },
  '/content/experience-fragments/stryker/emergency-care/en/news/why-every-college-campus-needs-accessible-aeds/master': {
    name: 'Article body of "Why every college campus needs accessible AEDs"',
  },
  '/content/experience-fragments/stryker/emergency-care/en/news/the-role-of-defibrillation-during-sudden-cardiac-arrest/body': {
    name: 'Article body of "The role of defibrillation during sudden cardiac arrest"',
  },
  '/content/experience-fragments/stryker/emergency-care/en/news/how-to-prepare-your-workplace-for-a-sudden-cardiac-emergency/master': {
    name: 'Article body of "How to prepare your workplace for a sudden cardiac emergency"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/features/a_winning_spirit/a-winning-spirit/master': {
    name: 'Article body of "A winning spirit"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2023/features/five_things_to_know_/body-copy/master': {
    name: 'Article body of "Five things to know about heart attacks and sudden cardiac arrests"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/what_it_s_like_being/body-copy/master': {
    name: 'Article body of "What it’s like being a caregiver to a loved one with Alzheimer’s"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/features/making_a_difference_/text-1/master': {
    name: 'Article body part of "Making a difference through mentorship"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/features/making_a_difference_/mentors/master': {
    name: 'Article body part of "Making a difference through mentorship"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/features/making_a_difference_/text-2/master': {
    name: 'Article body part of "Making a difference through mentorship"',
  },
  '/content/experience-fragments/stryker/emergency-care/en/news/12-year-old-girl-experiences-cardiac-arrest-stryker-employee-re/body': {
    name: 'Article body of "12-year-old girl experiences cardiac arrest, Stryker employee responds"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/how_augmented_realit/body-copy/master': {
    name: 'Article body part of "How augmented reality can help care teams plan, design and construct new operating rooms"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2024/features/how_augmented_realit/body-copy/body-copy-2': {
    name: 'Article body part of "How augmented reality can help care teams plan, design and construct new operating rooms"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/features/innovation_inspired_/text/body-copy-1/master': {
    name: 'Article body part of "Innovation inspired by insights: the next generation, first completely wireless hospital bed is here"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/features/innovation_inspired_/text/body-copy-2/master': {
    name: 'Article body part of "Innovation inspired by insights: the next generation, first completely wireless hospital bed is here"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/features/stryker_holds_divers/body-copy/master': {
    name: 'Article body of "Stryker holds diversity, equity and inclusion summit"',
  },
  '/content/experience-fragments/stryker/emergency-care/en/news/how-the-right-equipment-can-help-recruit-and-retain-emts-and-par/body': {
    name: 'Article body of "How the right equipment can help recruit and retain EMTs and paramedics"',
  },
  '/content/experience-fragments/stryker/emergency-care/en/news/four-reasons-every-school-should-have-an-aed/master': {
    fragment: '/us/en/fragments/stryker/emergency-care/en/news/four-reasons-every-school-should-have-an-aed/body',
    name: 'Article body of "Four reasons every school needs AEDs"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/advancing_healthcare/body-copy/master': {
    name: 'Article body of "Advancing healthcare through Asian culture and collaboration"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/_2022/features/more_than_able_to_ma/body-copy/master': {
    name: 'Article body of "More than able to make healthcare better"',
  },
  '/content/experience-fragments/stryker/corporate/en/about/news/features/technologies_that_pr/body-copy/master': {
    name: 'Article body of "Technologies that promote safe care for mother and baby during childbirth"',
  },
  '/content/experience-fragments/stryker/emergency-care/en/news/5-steps-to-convince-decision-makers-to-adopt-an-aed-program/body': {
    name: 'Article body of "5 steps to convince decision makers to adopt an AED program"',
  },
  '/content/experience-fragments/stryker/emergency-care/en/news/8-steps-to-a-successful-aed-safety-program/body': {
    name: 'Article body of "8 steps to a successful AED safety program"',
  },
  '/content/experience-fragments/stryker/surgical-technologies/en/news/addressing_or_and_l_/carousel/master': {
    name: 'Article body of "Addressing OR and L&D Challenges with Adjunct Technology"',
  },
  '/content/experience-fragments/stryker/corporate/en/interventional-spine/footnotes/back-button/master': {
    name: 'Interventional Spine footnotes "❮ BACK" link (footnote detail pages)',
  },
};
