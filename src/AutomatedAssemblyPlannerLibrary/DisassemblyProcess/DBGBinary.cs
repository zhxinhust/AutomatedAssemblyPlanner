﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GraphSynth.Representation;
using StarMathLib;
using Assembly_Planner.GraphSynth.BaseClasses;

namespace Assembly_Planner
{
    internal class DBGBinary
    {
        static List<hyperarc> Preceedings = new List<hyperarc>();
        private static int Counter0;
        private static List<hyperarc> Visited = new List<hyperarc>();
        public static Dictionary<int, HashSet<int>> ParallelAndSame;
        public static Dictionary<int, HashSet<int>> ParallelAndOpposite;
        internal static Dictionary<hyperarc, List<hyperarc>> DirectionalBlockingGraph(designGraph assemblyGraph, int cndDirInd, bool relaxingSc = false)
        {
            // So, I am trying to make the DBG for for each seperate hyperarc. 
            // This hyperarc includes small hyperarcs with the lable  "SCC"
            // Each element of the DBG is one SCC hyperarc
            //  I was thinking instead of having a graph for DBG, simly create a dictionary
            //      the key is the SCC hyperarc and the value is a list of hyperarcs which are blocking the key

            // 6/17/2015: One important thing I need to add to the DBG is the blocking between parts which are not 
            //            connected (touched). For instance in my PumpAssembly, ring is not connected to the shaft
            //            but it is blocked by that. Also shaft is not touching the lid, but it is blocked by that. 

            var dbgDictionary = new Dictionary<hyperarc, List<hyperarc>>();
            var dbgDictionaryAdjacent = new Dictionary<hyperarc, List<hyperarc>>();
            //var connectedButUnblocked= new Dictionary<hyperarc, List<hyperarc>>();
            foreach (var sccHy in assemblyGraph.hyperarcs.Where(h => h.localLabels.Contains(DisConstants.SCC)))
            {
                var hyperarcBorderArcs = HyperarcBorderArcsFinder(sccHy);
                var blockedWith = new List<hyperarc>();
                var blockedWith2 = new List<hyperarc>();
                //var notBlockedWith = new List<hyperarc>();
                foreach (var borderArc in hyperarcBorderArcs)
                {
                    // if (From in sccHy)
                    //      blocked if: has a direction which is parallel but reverse
                    // if (To in sccHy)
                    //      blocked if: has a direction which is parallel and same direction
                    var blocking = BlockingSccFinder(assemblyGraph, sccHy, borderArc);
                    if (sccHy.nodes.Contains(borderArc.From))
                    {
                        if (Parallel(borderArc, cndDirInd) != -1)
                        {
                            //notBlockedWith.Add(blocking);
                            continue;
                        }
                        if (!blockedWith.Contains(blocking))
                        {
                            blockedWith.Add(blocking);
                            blockedWith2.Add(blocking);
                        }
                    }
                    else // contains  "To"
                    {
                        if (Parallel(borderArc, cndDirInd) != 1)
                        {
                            //notBlockedWith.Add(blocking);
                            continue;
                        }
                        if (!blockedWith.Contains(blocking))
                        {
                            blockedWith.Add(blocking);
                            blockedWith2.Add(blocking);
                        }
                    }
                }
                dbgDictionary.Add(sccHy, blockedWith);
                dbgDictionaryAdjacent.Add(sccHy, blockedWith2);
                //connectedButUnblocked.Add(sccHy,notBlockedWith);
            }
            //dbgDictionary = CombineWithNonAdjacentBlockings2(dbgDictionary, cndDirInd);
            dbgDictionary = CombineWithNonAdjacentBlockingsUsingSecondaryConnections(dbgDictionary, assemblyGraph, cndDirInd, relaxingSc);
            dbgDictionary = SolveMutualBlocking(assemblyGraph, dbgDictionary, dbgDictionaryAdjacent, relaxingSc);
            dbgDictionary = UpdateBlockingDic(dbgDictionary);
            //if (MutualBlocking(assemblyGraph, dbgDictionary))
            //    dbgDictionary = DirectionalBlockingGraph(assemblyGraph, seperate, cndDirInd); // This is expensive. Get rid of it.
            if (MutualBlocking2(assemblyGraph, dbgDictionary))
                dbgDictionary = SolveMutualBlocking(assemblyGraph, dbgDictionary, dbgDictionaryAdjacent, relaxingSc);
            return dbgDictionary;
        }


        private static Dictionary<hyperarc, List<hyperarc>> CombineWithNonAdjacentBlockingsUsingSecondaryConnections(
            Dictionary<hyperarc, List<hyperarc>> dbgDictionary, designGraph assemblyGraph, int cndDirInd,
            bool relaxingSc)
        {
            var oppositeDir = new List<int> { DisassemblyDirections.DirectionsAndOppositsForGlobalpool[cndDirInd] };
            foreach (SecondaryConnection SC in assemblyGraph.arcs.Where(a => a is SecondaryConnection))
            {
                var blockedScc = dbgDictionary.Keys.Where(scc => scc.nodes.Contains(SC.From));
                var blockingScc = dbgDictionary.Keys.Where(scc => scc.nodes.Contains(SC.To));
                if (!blockedScc.Any() || !blockingScc.Any())
                    continue;
                if (ContainsADirection(new HashSet<int>(SC.Directions), cndDirInd) &&
                    ContainsADirection(new HashSet<int>(SC.Directions), oppositeDir[0]) && !relaxingSc)
                {
                    foreach (var blocked in blockedScc)
                    {
                        foreach (var blocking in blockingScc.Where(b => b != blocked))
                        {
                            if (!dbgDictionary[blocked].Contains(blocking))
                                dbgDictionary[blocked].Add(blocking);
                            if (!dbgDictionary[blocking].Contains(blocked))
                                dbgDictionary[blocking].Add(blocked);
                        }
                    }
                }
                else if (ContainsADirection(new HashSet<int>(SC.Directions), cndDirInd))
                {
                    foreach (var blocked in blockedScc)
                    {
                        foreach (var blocking in blockingScc.Where(b => b != blocked))
                        {
                            if (!dbgDictionary[blocked].Contains(blocking))
                                dbgDictionary[blocked].Add(blocking);
                        }
                    }
                }
                else if (ContainsADirection(new HashSet<int>(SC.Directions), oppositeDir[0]))
                {
                    foreach (var blocked in blockedScc)
                    {
                        foreach (var blocking in blockingScc.Where(b => b != blocked))
                        {
                            if (!dbgDictionary[blocking].Contains(blocked))
                                dbgDictionary[blocking].Add(blocked);
                        }
                    }
                }

            }
            return dbgDictionary;
        }

        private static bool ContainsADirection(HashSet<int> dirs, int d)
        {
            if (dirs.Any(DisassemblyDirections.DirectionsAndSame[d].Contains)) return true;
            return false;
        }

        internal static Dictionary<hyperarc, List<hyperarc>> SolveMutualBlocking(designGraph assemblyGraph,
            Dictionary<hyperarc, List<hyperarc>> dbgDictionary,
            Dictionary<hyperarc, List<hyperarc>> dbgDictionaryAdjacent, bool relaxingSc = false)
        {
            foreach (var key in dbgDictionary.Keys)
            {
                if (dbgDictionary[key].Contains(key))
                    dbgDictionary[key].Remove(key);
            }
            for (var i = 0; i < dbgDictionary.Count - 1; i++)
            {
                var iKey = dbgDictionary.Keys.ToList()[i];
                dbgDictionary[iKey].RemoveAll(a => a == null);
                for (var j = i + 1; j < dbgDictionary.Count; j++)
                {
                    var jKey = dbgDictionary.Keys.ToList()[j];
                    dbgDictionary[jKey].RemoveAll(a => a == null);
                    if (dbgDictionary[iKey].Contains(jKey) && dbgDictionary[jKey].Contains(iKey))
                    {
                        if (relaxingSc)
                        {
                            // if these two keys are not phisically connected, update the dbg
                            /*if (
                                assemblyGraph.arcs.Where(a => a is Connection)
                                    .Cast<Connection>()
                                    .Any(
                                        a =>
                                            (iKey.nodes.Any(n => n.name == a.From.name) &&
                                             jKey.nodes.Any(n => n.name == a.To.name)) ||
                                            (iKey.nodes.Any(n => n.name == a.To.name) &&
                                             jKey.nodes.Any(n => n.name == a.From.name))))
                                continue;*/
                            if (dbgDictionaryAdjacent[iKey].Contains(jKey) && dbgDictionaryAdjacent[jKey].Contains(iKey))
                            {
                                continue;
                            }
                            // take the one with less volume and delete it from the value of the otherone's key
                            var volumei = iKey.nodes.Cast<Component>().Sum(n => n.Volume);
                            var volumej = jKey.nodes.Cast<Component>().Sum(n => n.Volume);
                            if ((dbgDictionary[iKey].Count == 1 && dbgDictionary[jKey].Count == 1) ||
                                (dbgDictionary[iKey].Count > 1 && dbgDictionary[jKey].Count > 1))
                            {
                                if (!dbgDictionaryAdjacent[iKey].Contains(jKey) &&
                                    !dbgDictionaryAdjacent[jKey].Contains(iKey))
                                {
                                    if (volumei < volumej)
                                    {
                                        if (!dbgDictionaryAdjacent[iKey].Contains(jKey))
                                            dbgDictionary[iKey].Remove(jKey);
                                    }
                                    else dbgDictionary[jKey].Remove(iKey);

                                }
                                if (!dbgDictionaryAdjacent[iKey].Contains(jKey))
                                    dbgDictionary[iKey].Remove(jKey);
                                else
                                    dbgDictionary[jKey].Remove(iKey);
                                dbgDictionary[iKey].RemoveAll(a => a == null);
                                dbgDictionary[jKey].RemoveAll(a => a == null);
                            }
                            else
                            {
                                if (!dbgDictionaryAdjacent[iKey].Contains(jKey) &&
                                    !dbgDictionaryAdjacent[jKey].Contains(iKey))
                                {
                                    if (dbgDictionary[iKey].Count == 1) dbgDictionary[iKey].Remove(jKey);
                                    else dbgDictionary[jKey].Remove(iKey);

                                }
                                if (!dbgDictionaryAdjacent[iKey].Contains(jKey))
                                    dbgDictionary[iKey].Remove(jKey);
                                else
                                    dbgDictionary[jKey].Remove(iKey);
                                dbgDictionary[iKey].RemoveAll(a => a == null);
                                dbgDictionary[jKey].RemoveAll(a => a == null);
                            }
                            continue;
                        }
                        var nodes = new List<node>();
                        nodes.AddRange(iKey.nodes);
                        nodes.AddRange(jKey.nodes);
                        var nodes2 = new List<node>(nodes);
                        var last = assemblyGraph.addHyperArc(nodes2);
                        last.localLabels.Add(DisConstants.SCC);
                        var updatedBlocking = new List<hyperarc>();
                        updatedBlocking.AddRange(dbgDictionary[iKey].Where(hy => hy != jKey));
                        updatedBlocking.AddRange(
                            dbgDictionary[jKey].Where(hy => hy != iKey && !updatedBlocking.Contains(hy)));
                        var updatedBlocking2 = new List<hyperarc>(updatedBlocking);
                        dbgDictionary.Remove(iKey);
                        dbgDictionary.Remove(jKey);
                        foreach (var key in dbgDictionary.Keys.ToList())
                        {
                            if (dbgDictionary[key].Contains(iKey) || dbgDictionary[key].Contains(jKey))
                            {
                                dbgDictionary[key].Add(last);
                                dbgDictionary[key].Remove(iKey);
                                dbgDictionary[key].Remove(jKey);
                                dbgDictionary[key].RemoveAll(a => a == null);
                            }
                        }

                        assemblyGraph.removeHyperArc(iKey);
                        assemblyGraph.removeHyperArc(jKey);
                        // if there is no connection between the keys 
                        dbgDictionary.Add(last, updatedBlocking2);
                        i--;
                        break;
                    }
                }
            }
            return dbgDictionary;
        }

        private static bool MutualBlocking(designGraph assemblyGraph, Dictionary<hyperarc, List<hyperarc>> dbgDictionary)
        {
            for (var i = 0; i < dbgDictionary.Count - 1; i++)
            {
                var iKey = dbgDictionary.Keys.ToList()[i];
                for (var j = i + 1; j < dbgDictionary.Count; j++)
                {
                    var jKey = dbgDictionary.Keys.ToList()[j];
                    if (dbgDictionary[iKey].Contains(jKey) && dbgDictionary[jKey].Contains(iKey))
                    {
                        var nodes = new List<node>();
                        nodes.AddRange(iKey.nodes);
                        nodes.AddRange(jKey.nodes);
                        assemblyGraph.removeHyperArc(iKey);
                        assemblyGraph.removeHyperArc(jKey);
                        var last = assemblyGraph.addHyperArc(nodes);
                        last.localLabels.Add(DisConstants.SCC);
                        return true;
                    }
                }
            }
            return false;
        }

        private static bool MutualBlocking2(designGraph assemblyGraph, Dictionary<hyperarc, List<hyperarc>> dbgDictionary)
        {
            for (var i = 0; i < dbgDictionary.Count - 1; i++)
            {
                var iKey = dbgDictionary.Keys.ToList()[i];
                for (var j = i + 1; j < dbgDictionary.Count; j++)
                {
                    var jKey = dbgDictionary.Keys.ToList()[j];
                    if (dbgDictionary[iKey].Contains(jKey) && dbgDictionary[jKey].Contains(iKey))
                    {
                        return true;
                    }
                }
            }
            return false;
        }

        private static Dictionary<hyperarc, List<hyperarc>> CombineWithNonAdjacentBlockings2(Dictionary<hyperarc, List<hyperarc>> dbgDictionary, int cndDirInd)
        {
            var direction = DisassemblyDirections.Directions[cndDirInd];
            var dirs = (from gDir in DisassemblyDirections.Directions
                        where 1 - Math.Abs(gDir.dotProduct(direction)) < OverlappingFuzzification.CheckWithGlobDirsParall
                        select DisassemblyDirections.Directions.IndexOf(gDir)).ToList();
            if (NonadjacentBlockingDetermination.NonAdjacentBlocking.Count == 0) return dbgDictionary;
            foreach (var dir in dirs)
            {
                if (dir == cndDirInd)
                {
                    foreach (var nonAdjBlo in NonadjacentBlockingDetermination.NonAdjacentBlocking[dir])
                    {
                        foreach (
                            var scc1 in
                                dbgDictionary.Keys.Where(scc1 => scc1.nodes.Any(n => n.name == nonAdjBlo.blockingSolids[0].Name))
                                    .ToList())
                        {
                            foreach (
                                var scc2 in
                                    dbgDictionary.Keys.Where(
                                        scc2 => scc2 != scc1 && scc2.nodes.Any(n => n.name == nonAdjBlo.blockingSolids[1].Name)))
                            {
                                if (!dbgDictionary[scc1].Contains(scc2))
                                    dbgDictionary[scc1].Add(scc2);
                                break;
                            }
                            break;
                        }
                    }
                }
                else
                {
                    foreach (var nonAdjBlo in NonadjacentBlockingDetermination.NonAdjacentBlocking[dir])
                    {
                        foreach (
                            var scc1 in
                                dbgDictionary.Keys.Where(scc1 => scc1.nodes.Any(n => n.name == nonAdjBlo.blockingSolids[1].Name))
                                    .ToList())
                        {
                            foreach (
                                var scc2 in
                                    dbgDictionary.Keys.Where(
                                        scc2 => scc2 != scc1 && scc2.nodes.Any(n => n.name == nonAdjBlo.blockingSolids[0].Name)))
                            {
                                if (!dbgDictionary[scc1].Contains(scc2))
                                    dbgDictionary[scc1].Add(scc2);

                                break;
                            }
                            break;
                        }
                    }
                }
            }
            return dbgDictionary;
        }

        internal static int Parallel(Connection borderArc, int cndDirInd)
        {
            //  1: parallel and same direction
            // -1: parallel but opposite direction
            //  0: not parallel. 
            //  2: parralel same direction and opposite direction
            //var cndDir = DisassemblyDirections.Directions[cndDirInd];
            var paralAndSame = false;
            var paralButOppose = false;
            foreach (var dirInd in borderArc.InfiniteDirections)
            {
                if (ParallelAndSame[cndDirInd].Contains(dirInd))
                    //var arcDisDir = DisassemblyDirections.Directions[dirInd];
                    //if (Math.Abs(1 - arcDisDir.dotProduct(cndDir)) < OverlappingFuzzification.CheckWithGlobDirsParall2)
                    paralAndSame = true;
                if (ParallelAndOpposite[cndDirInd].Contains(dirInd))
                    //if (Math.Abs(1 + arcDisDir.dotProduct(cndDir)) < OverlappingFuzzification.CheckWithGlobDirsParall2)
                    paralButOppose = true;
            }
            if (paralAndSame && paralButOppose) return 2;
            if (paralAndSame) return 1;
            if (paralButOppose) return -1;
            return 0;
        }

        private static hyperarc BlockingSccFinder(designGraph graph, hyperarc sccHy, Connection arc)
        {
            if (sccHy.nodes.Contains(arc.From))
            {
                foreach (var hy in graph.hyperarcs.Where(h => h.localLabels.Contains(DisConstants.SCC)))
                {
                    if (hy.nodes.Contains(arc.To))
                        return hy;
                }
                return null;
            }
            foreach (var hy in graph.hyperarcs.Where(h => h.localLabels.Contains(DisConstants.SCC)))
            {
                if (hy.nodes.Contains(arc.From))
                    return hy;
            }
            return null;
        }

        internal static List<Connection> HyperarcBorderArcsFinder(hyperarc sccHy)
        {
            var borders = new List<Connection>();
            foreach (Component node in sccHy.nodes)
            {
                foreach (Connection arc in node.arcs.Where(a => a is Connection))
                {
                    //var otherNode = arc.otherNode(node); //arc.From == node ? arc.To : arc.From;
                    if (sccHy.nodes.Contains(arc.otherNode(node))) continue;
                    borders.Add(arc);
                }
            }
            return borders;
        }
        private static Dictionary<hyperarc, List<hyperarc>> UpdateBlockingDic(Dictionary<hyperarc, List<hyperarc>> blockingDic)
        {
            var newBlocking = new Dictionary<hyperarc, List<hyperarc>>();
            foreach (var sccHy in blockingDic.Keys)
            {
                Preceedings.Clear();
                Counter0 = 0;
                PreceedingFinder(sccHy, blockingDic);
                Preceedings = Updates.UpdatePreceedings(Preceedings);
                Visited.Clear();
                var cpy = new List<hyperarc>(Preceedings);
                newBlocking.Add(sccHy, cpy);
            }
            return newBlocking;
        }
        private static void PreceedingFinder(hyperarc sccHy, Dictionary<hyperarc, List<hyperarc>> blockingDic)
        {
            Counter0++;
            if (Counter0 != 1)
                Preceedings.Add(sccHy);
            foreach (var value in blockingDic[sccHy].Where(v => v != null))
            {
                if (Visited.Contains(value)) continue;
                Visited.Add(value);
                PreceedingFinder(value, blockingDic);
            }
        }
    }
}
